package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"sort"

	"github.com/labstack/echo/v4"
	pxgrider_proto "github.com/vkumov/go-pxgrider/pkg"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/middleware"
	"github.com/cisco-open/sprt/frontend-svc/internal/pxgrid"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

func (m *controller) GetPxGridStatus(c echo.Context) error {
	enabled := m.App.PX().IsEnabled()
	healthy, healthErr := m.App.PX().IsHealthy(c.Request().Context())

	resp := map[string]any{
		"enabled": enabled,
		"healthy": healthy,
	}
	if healthErr != nil {
		resp["error"] = healthErr.Error()
	}

	return c.JSON(http.StatusOK, resp)
}

func (m *controller) GetPxGridConnectionsOfUser(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().Str("user_id", u.ForUser).Str("full_uid", uid).
		Msg("Getting pxGrid connections for user")

	connections, err := m.App.PX().GetConnections(ctx, &pxgrider_proto.GetConnectionsRequest{
		User: &pxgrider_proto.User{Uid: uid},
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	sorter := pxgrid.ConnectionSorter(connections.Connections)
	sort.Sort(sorter)
	connections.Connections = []*pxgrider_proto.Connection(sorter)

	return c.JSON(http.StatusOK, connections)
}

func (m *controller) GetPxGridConnectionOfUser(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("user_id", u.ForUser).Str("full_uid", uid).Str("connection_id", req.ConnectionID).
		Msg("Getting pxGrid connections for user")

	connection, err := m.App.PX().GetConnection(ctx, &pxgrider_proto.GetConnectionRequest{
		User: &pxgrider_proto.User{Uid: uid},
		Id:   req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if connection == nil || connection.GetConnection() == nil {
		return echo.ErrNotFound.WithInternal(fmt.Errorf("connection not found"))
	}

	return c.JSON(http.StatusOK, connection.GetConnection())
}

func (m *controller) GetPxGridConnectionsOfUserTotal(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().Str("user_id", u.ForUser).Str("full_uid", uid).Msg("Getting pxGrid connections for user")

	connections, err := m.App.PX().GetConnectionsTotal(ctx, &pxgrider_proto.GetConnectionsTotalRequest{
		User: &pxgrider_proto.User{Uid: uid},
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, connections)
}

func (m *controller) CheckPxFqdn(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Fqdn     string                          `json:"fqdn" validate:"required"`
		Strategy pxgrider_proto.FamilyPreference `json:"strategy"`
		DNSIP    string                          `json:"dns_ip" validate:"required"`
		DNSPort  uint32                          `json:"dns_port" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if _, ok := pxgrider_proto.FamilyPreference_name[int32(req.Strategy)]; !ok {
		return echo.ErrBadRequest.WithInternal(fmt.Errorf("invalid strategy"))
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("fqdn", req.Fqdn).Str("dns_ip", req.DNSIP).
		Uint32("dns_port", req.DNSPort).Msg("Checking pxGrid FQDN")

	r, err := m.App.PX().CheckFQDN(ctx, &pxgrider_proto.CheckFQDNRequest{
		Fqdn:             req.Fqdn,
		Dns:              &pxgrider_proto.DNS{Ip: req.DNSIP, Port: req.DNSPort},
		FamilyPreference: req.Strategy,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r)
}

type CreatePxGridConnectionRequest struct {
	FriendlyName string `json:"friendlyName" validate:"required"`
	ClientName   string `json:"clientName" validate:"required"`
	Description  string `json:"description" validate:"omitempty"`
	DNS          struct {
		IP   string `json:"ip" validate:"omitempty"`
		Port uint32 `json:"port" validate:"required_with=IP"`
	} `json:"dns" validate:"omitempty"`
	Nodes []struct {
		FQDN        string `json:"fqdn" validate:"required"`
		ControlPort uint32 `json:"controlPort" validate:"required"`
	} `json:"nodes" validate:"required,min=1"`
	Auth struct {
		Type        string `json:"type" validate:"required,oneof=password certificate"`
		Certificate string `json:"certificate" validate:"required_if=Type certificate"`
		PrivateKey  string `json:"privateKey" validate:"required_if=Type certificate"`
		Passphrase  string `json:"passphrase" validate:"omitempty"`
	} `json:"auth" validate:"required"`
	ServerVerify struct {
		Verify bool     `json:"verify" validate:"omitempty"`
		CA     []string `json:"ca" validate:"required_if=Verify true"`
	} `json:"serverVerify" validate:"required"`
}

func (m *controller) NewPxGridConnection(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(CreatePxGridConnectionRequest)
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("friendly_name", req.FriendlyName).Str("client_name", req.ClientName).
		Bool("server_verify", req.ServerVerify.Verify).Int("ca_count", len(req.ServerVerify.CA)).
		Int("nodes_count", len(req.Nodes)).Msg("Creating new pxGrid connection")

	checkReq := &pxgrider_proto.CheckFQDNRequest{Fqdn: req.Nodes[0].FQDN}
	if req.DNS.IP != "" {
		checkReq.Dns = &pxgrider_proto.DNS{Ip: req.DNS.IP, Port: req.DNS.Port}
	}
	r, err := m.App.PX().CheckFQDN(ctx, checkReq)
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}
	m.App.Logger().Debug().
		Str("node", req.Nodes[0].FQDN).Interface("candidate", r.Candidate).
		Str("error", r.Error).Bool("valid", r.IsValid).Interface("all_ips", r.Ips).
		Msg("Node validation")

	if !r.IsValid || r.Error != "" {
		errMsg := "Invalid node"
		if r.Error != "" {
			errMsg = r.Error
		}
		return echo.ErrBadRequest.WithInternal(errors.New(errMsg))
	}

	nodes := make([]*pxgrider_proto.Node, 0, len(req.Nodes))
	for _, n := range req.Nodes {
		nodes = append(nodes, &pxgrider_proto.Node{
			Fqdn:        n.FQDN,
			ControlPort: n.ControlPort,
		})
	}

	var dnsDetails *pxgrider_proto.DNSDetails
	if req.DNS.IP != "" {
		dnsDetails = &pxgrider_proto.DNSDetails{
			Dns: &pxgrider_proto.DNS{Ip: req.DNS.IP, Port: req.DNS.Port},
		}
	}

	creds := &pxgrider_proto.Credentials{
		NodeName: req.ClientName,
		Type:     pxgrider_proto.CredentialsType_CREDENTIALS_TYPE_PASSWORD,
		Kind:     &pxgrider_proto.Credentials_Password{},
	}
	if req.Auth.Type == "certificate" {
		creds.Type = pxgrider_proto.CredentialsType_CREDENTIALS_TYPE_CERTIFICATE
		// FIXME: add passphrase
		creds.Kind = &pxgrider_proto.Credentials_Certificate{
			Certificate: &pxgrider_proto.CredentialsCertificate{
				PrivateKey:     req.Auth.PrivateKey,
				Certificate:    req.Auth.Certificate,
				CaCertificates: []string{}, // FIXME: add CA certs
			},
		}
	}

	createResponse, err := m.App.PX().CreateConnection(ctx, &pxgrider_proto.CreateConnectionRequest{
		User:           &pxgrider_proto.User{Uid: uid},
		FriendlyName:   req.FriendlyName,
		Nodes:          nodes,
		Credentials:    creds,
		Description:    req.Description,
		ClientName:     req.ClientName,
		DnsDetails:     dnsDetails,
		InsecureTls:    !req.ServerVerify.Verify,
		CaCertificates: req.ServerVerify.CA,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, createResponse)
}

func (m *controller) DeletePxGridConnection(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Deleting pxGrid connection")

	_, err = m.App.PX().DeleteConnection(ctx, &pxgrider_proto.DeleteConnectionRequest{
		User: &pxgrider_proto.User{Uid: uid},
		Id:   req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) RefreshPxGridConnectionState(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Refreshing pxGrid connection state")

	r, err := m.App.PX().RefreshAccountState(ctx, &pxgrider_proto.RefreshAccountStateRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r)
}

func (m *controller) GetPxGridConnectionServices(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Getting pxGrid connection services")

	r, err := m.App.PX().GetConnectionServices(ctx, &pxgrider_proto.GetConnectionServicesRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, pxgrid.ToJSONServicesResponse(r))
}

func (m *controller) GetPxGridConnectionService(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("service_name", req.ServiceName).
		Msg("Getting pxGrid connection service")

	svc, err := m.App.PX().GetConnectionService(ctx, &pxgrider_proto.GetConnectionServiceRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	rest, err := m.App.PX().GetServiceMethods(ctx, &pxgrider_proto.GetServiceMethodsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	topics, err := m.App.PX().GetServiceTopics(ctx, &pxgrider_proto.GetServiceTopicsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"lookup": svc.GetService(),
		"rest":   rest.GetMethods(),
		"topics": topics.GetTopics().GetTopics(),
	})
}

func (m *controller) GetPxGridConnectionTopics(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Getting pxGrid connection topics")

	r, err := m.App.PX().GetConnectionTopics(ctx, &pxgrider_proto.GetConnectionTopicsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	subs, err := m.App.PX().GetAllSubscriptions(ctx, &pxgrider_proto.GetAllSubscriptionsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"topics":        pxgrid.ToJSONTopicResponse(r),
		"subscriptions": subs.GetSubscriptions(),
	})
}

func (m *controller) SubscribeToPxGridTopic(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
		Topic        string `json:"topic" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("topic", req.Topic).
		Msg("Subscribing to pxGrid topic")

	r, err := m.App.PX().SubscribeConnection(ctx, &pxgrider_proto.SubscribeConnectionRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		Topic:        req.Topic,
		Service:      req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r.Subscription)
}

func (m *controller) UnsubscribeFromPxGridTopic(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
		Topic        string `json:"topic" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("topic", req.Topic).
		Msg("Unsubscribing from pxGrid topic")

	_, err = m.App.PX().UnsubscribeConnection(ctx, &pxgrider_proto.UnsubscribeConnectionRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		Topic:        req.Topic,
		Service:      req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) GetPxGridConnectionMessages(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		Pagination
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Interface("pagination", req.Pagination).
		Msg("Getting pxGrid connection messages")

	mess, err := m.App.PX().GetConnectionMessages(ctx, &pxgrider_proto.GetConnectionMessagesRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		Limit:        int64(req.Pagination.Limit),
		Offset:       req.Pagination.CalculateOffset(),
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, mess)
}

func (m *controller) DeletePxGridConnectionMessages(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string  `param:"connection_id" validate:"required"`
		All          bool    `json:"all" validate:"omitempty"`
		IDs          []int64 `json:"ids" validate:"omitempty,required_if=All false,min=1,dive,min=1"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Deleting pxGrid connection messages")

	deleteReq := &pxgrider_proto.DeleteConnectionMessagesRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	}

	if req.All {
		deleteReq.What = &pxgrider_proto.DeleteConnectionMessagesRequest_All{All: true}
	} else {
		deleteReq.What = &pxgrider_proto.DeleteConnectionMessagesRequest_MessageIds{
			MessageIds: &pxgrider_proto.MessageIDs{Ids: req.IDs},
		}
	}

	_, err = m.App.PX().DeleteConnectionMessages(ctx, deleteReq)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) GetPxGridConnectionLogs(c echo.Context) error {
	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		Pagination
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Getting pxGrid connection logs")

	logs, err := m.App.PX().GetConnectionLogs(c.Request().Context(), &pxgrider_proto.GetConnectionLogsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		Limit:        int64(req.Pagination.Limit),
		Offset:       req.Pagination.CalculateOffset(),
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, logs)
}

func (m *controller) DeletePxGridConnectionLogs(c echo.Context) error {
	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string  `param:"connection_id" validate:"required"`
		All          bool    `json:"all" validate:"omitempty"`
		IDs          []int64 `json:"ids" validate:"omitempty,required_if=All false,min=1,dive,min=1"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Msg("Deleting pxGrid connection logs")

	deleteReq := &pxgrider_proto.DeleteConnectionLogsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
	}

	if req.All {
		deleteReq.What = &pxgrider_proto.DeleteConnectionLogsRequest_All{All: true}
	} else {
		deleteReq.What = &pxgrider_proto.DeleteConnectionLogsRequest_LogIds{
			LogIds: &pxgrider_proto.LogIDs{Ids: req.IDs},
		}
	}

	_, err = m.App.PX().DeleteConnectionLogs(c.Request().Context(), deleteReq)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) PxGridConnectionServiceLookup(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("service_name", req.ServiceName).
		Msg("Looking up pxGrid connection service")

	r, err := m.App.PX().ServiceLookup(ctx, &pxgrider_proto.ServiceLookupRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r)
}

func (m *controller) PxGridConnectionServiceUpdateSecrets(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("service_name", req.ServiceName).
		Msg("Updating pxGrid connection service secrets")

	_, err = m.App.PX().ServiceUpdateSecrets(ctx, &pxgrider_proto.ServiceUpdateSecretsRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) PxGridConnectionServiceCheckNodes(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string `param:"connection_id" validate:"required"`
		ServiceName  string `param:"service" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().
		Str("full_uid", uid).Str("connection_id", req.ConnectionID).Str("service_name", req.ServiceName).
		Msg("Checking pxGrid connection service nodes")

	r, err := m.App.PX().ServiceCheckNodes(ctx, &pxgrider_proto.ServiceCheckNodesRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r)
}

type InputParam struct {
	Name  string `json:"name" validate:"required"`
	Value any    `json:"value" validate:"omitempty"`
}

func (m *controller) PxGridConnectionServiceREST(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ConnectionID string       `param:"connection_id" validate:"required"`
		ServiceName  string       `param:"service" validate:"required"`
		Method       string       `json:"method" validate:"required"`
		Params       []InputParam `json:"params" validate:"omitempty"`
		Node         string       `json:"node" validate:"omitempty"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	uid := prefixedPxGridUser(u)
	m.App.Logger().Debug().Str("full_uid", uid).Str("method", req.Method).Str("node", req.Node).
		Msg("Calling pxGrid connection service REST")

	protoParams, err := inputParamsToProto(req.Params)
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("full_uid", uid).Str("connection_id", req.ConnectionID).
		Interface("params", protoParams).
		Msg("Calling pxGrid connection service REST")
	r, err := m.App.PX().CallServiceMethod(ctx, &pxgrider_proto.CallServiceMethodRequest{
		User:         &pxgrider_proto.User{Uid: uid},
		ConnectionId: req.ConnectionID,
		ServiceName:  req.ServiceName,
		MethodName:   req.Method,
		Params:       protoParams,
		Node:         req.Node,
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, r)
}

func inputParamsToProto(params []InputParam) ([]*pxgrider_proto.ParamValue, error) {
	protoParams := make([]*pxgrider_proto.ParamValue, 0, len(params))
	for _, p := range params {
		if p.Value == nil {
			continue
		}

		js, err := json.Marshal(p.Value)
		if err != nil {
			return nil, err
		}
		protoParams = append(protoParams, &pxgrider_proto.ParamValue{
			Name:      p.Name,
			JsonValue: string(js),
		})
	}
	return protoParams, nil
}

func prefixedPxGridUser(u *auth.ExtendedUserData) string {
	return middleware.CurrentAuthProvider().ProviderPrefix() + ":" + u.ForUser
}

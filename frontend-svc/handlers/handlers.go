package handlers

import (
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	m "github.com/cisco-open/sprt/frontend-svc/internal/middleware"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

type controller struct {
	App *config.AppConfig
}

// REST is a "controller" for all API handlers
var rest *controller

// NewHandlers creates and updates global REST "controller"
func NewHandlers(a *config.AppConfig) {
	rest = &controller{
		App: a,
	}
}

func RegisterRoutes(a *config.AppConfig, e *echo.Echo) {
	e.GET("/login", Login)
	e.POST("/login", Login)

	if cb := m.CurrentAuthProvider().CallbackPath(); cb != "" {
		a.Logger().Debug().Str("cb_path", cb).Msg("setting callback path")
		e.GET(cb, LoginCallback)
	}

	e.GET("/logout", Logout)
	e.POST("/logout", Logout)

	api := e.Group("/api")
	v2 := api.Group("/v2")

	v2.POST("/logger", StoreUILogs)

	addLogsAPIRoutes(v2.Group("/logs"))
	addCleanupAPIRoutes(v2.Group("/cleanup"))
	addSettingsAPIRoutes(v2.Group("/settings"))
	addCertificatesAPIRoutes(v2.Group("/certificates"))
	addSessionsAPIRoutes(v2.Group("/sessions"))
	addJobsAPIRoutes(v2.Group("/jobs"))
	addPxGridAPIRoutes(v2.Group("/pxgrid"))
	addGenerateAPIRoutes(v2.Group("/generate"))
	addScepRoutes(v2.Group("/scep"))
	addGlobalConfigAPIRoutes(v2.Group("/config"))

	addUIAPIRoutes(api.Group("/ui"))

	v2.RouteNotFound("/*", func(echo.Context) error {
		return echo.NewHTTPError(404, "Not Found")
	})
}

func addSettingsAPIRoutes(r shared.EchoRouter) {
	r.GET("/servers", rest.GetServersSettings, m.ValidatePermission("settings.read_servers.others"))
	r.POST("/servers", rest.CreateServerSettings, m.ValidatePermission("settings.create_servers.others"))

	r.GET("/servers/:id", rest.GetServerSettings, m.ValidatePermission("settings.read_servers.others"))
	r.DELETE("/servers/:id", rest.DeleteServerSettings, m.ValidatePermission("settings.delete_servers.others"))
	r.PUT("/servers/:id", rest.UpdateServerSettings, m.ValidatePermission("settings.update_servers.others"))

	r.GET("/api", rest.GetAPISettings, m.ValidatePermission("settings.read_api.others"))
	r.GET("/api/token", rest.GetAPISettingsToken, m.ValidatePermission("settings.read_api.others"))
	r.POST("/api/enable", rest.EnableAPISettings, m.ValidatePermission("settings.update_api.others"))
	r.POST("/api/disable", rest.DisableAPISettings, m.ValidatePermission("settings.update_api.others"))
	r.POST("/api/regenerate-token", rest.RegenAPISettingsToken, m.ValidatePermission("settings.update_api.others"))

	r.GET("/dictionary-types", rest.GetDictionaryTypes)

	r.GET("/dictionaries", rest.GetDictionariesOfType, m.ValidatePermission("dictionaries.read.others"))
	r.POST("/dictionaries", rest.CreateDictionary, m.ValidatePermission("dictionaries.create.others"))

	r.GET("/dictionaries/:id", rest.GetDictionaryByID)
	r.PUT("/dictionaries/:id", rest.UpdateDictionary)
	r.DELETE("/dictionaries/:id", rest.DeleteDictionaryByID)

	r.GET("/sms-gateway", rest.GetSmsGatewayConfig, m.ValidatePermission("sms_gateway.read.others"))
	r.PUT("/sms-gateway", rest.UpdateSmsGatewayConfig, m.ValidatePermission("sms_gateway.update.others"))
	r.GET("/sms-gateway/examples", rest.GetSmsGatewayConfigExamples, m.ValidatePermission("sms_gateway.read.others"))

	r.GET("/defaults/generate", rest.GetUserGenerateDefaults, m.ValidatePermission("settings.read_defaults.others"))
	r.PUT("/defaults/generate", rest.UpdateUserGenerateDefaults, m.ValidatePermission("settings.update_defaults.others"))
}

func addCertificatesAPIRoutes(r shared.EchoRouter) {
	r.GET("/identity", rest.GetCertificatesOfType(models.CertTypeIdentity), m.ValidatePermission("certificates.read.others"))
	r.DELETE("/identity", rest.DeleteMultipleCertificates, m.ValidatePermission("certificates.delete.others"))
	r.POST("/identity", rest.ImportIdentityCertificate, m.ValidatePermission("certificates.create.others"))
	r.GET("/identity/:id", rest.GetCertificateByID, m.ValidatePermission("certificates.read.others"))
	r.PATCH("/identity/:id", rest.RenameCertificate, m.ValidatePermission("certificates.update.others"))
	r.DELETE("/identity/:id", rest.DeleteCertificate, m.ValidatePermission("certificates.delete.others"))

	r.GET("/trusted", rest.GetCertificatesOfType(models.CertTypeTrusted), m.ValidatePermission("certificates.read.others"))
	r.DELETE("/trusted", rest.DeleteMultipleCertificates, m.ValidatePermission("certificates.delete.others"))
	r.POST("/trusted", rest.ImportTrustedCertificates, m.ValidatePermission("certificates.create.others"))
	r.GET("/trusted/:id", rest.GetCertificateByID, m.ValidatePermission("certificates.read.others"))
	r.PATCH("/trusted/:id", rest.RenameCertificate, m.ValidatePermission("certificates.update.others"))
	r.DELETE("/trusted/:id", rest.DeleteCertificate, m.ValidatePermission("certificates.delete.others"))

	r.GET("/signer", rest.GetCertificatesOfType(models.CertTypeSigner), m.ValidatePermission("certificates.read.others"))
	r.DELETE("/signer", rest.DeleteMultipleCertificates, m.ValidatePermission("certificates.delete.others"))
	// r.POST("/signer", rest.ImportSignerCertificate, m.ValidatePermission("certificates.create.others"))
	r.GET("/signer/:id", rest.GetCertificateByID, m.ValidatePermission("certificates.read.others"))
	r.PATCH("/signer/:id", rest.RenameCertificate, m.ValidatePermission("certificates.update.others"))
	r.DELETE("/signer/:id", rest.DeleteCertificate, m.ValidatePermission("certificates.delete.others"))

	r.POST("/export", rest.ExportCertificate, m.ValidatePermission("certificates.read.others"))

	r.GET("/templates", rest.GetCertTemplates, m.ValidatePermission("certificates.read.others"))
	r.POST("/templates", rest.AddCertTemplate, m.ValidatePermission("certificates.create.others"))
	r.DELETE("/templates", rest.DeleteMultipleCertTemplates, m.ValidatePermission("certificates.delete.others"))
	r.GET("/templates/:id", rest.GetCertTemplateByID, m.ValidatePermission("certificates.read.others"))
	r.DELETE("/templates/:id", rest.DeleteCertTemplate, m.ValidatePermission("certificates.delete.others"))
	r.PUT("/templates/:id", rest.UpdateCertTemplate, m.ValidatePermission("certificates.update.others"))
}

func addScepRoutes(r shared.EchoRouter) {
	r.GET("/servers", rest.GetScepServers, m.ValidatePermission("scep.read.others"))
	r.POST("/servers", rest.CreateScepServer, m.ValidatePermission("scep.create.others"))

	r.GET("/servers/:id", rest.GetScepServer, m.ValidatePermission("scep.read.others"))
	r.DELETE("/servers/:id", rest.DeleteScepServer, m.ValidatePermission("scep.delete.others"))
	r.PUT("/servers/:id", rest.UpdateScepServer, m.ValidatePermission("scep.update.others"))

	r.POST("/test/connection", rest.TestScepConnection, m.ValidatePermission("scep.test_connection.others"))
	r.POST("/test/enroll", rest.TestScepEnroll, m.ValidatePermission("scep.test_enroll.others"))
}

func addLogsAPIRoutes(r shared.EchoRouter) {
	r.GET("", rest.GetLogOwners, m.ValidatePermission("logs.owners.get_all", policy.PoliceAlways()))
	r.GET("/:owner", rest.GetLogOwnerChunks)
	r.DELETE("/:owner", rest.DeleteLogs)
	r.GET("/:owner/:chunk", rest.GetLogsChunk)
	r.DELETE("/:owner/:chunk", rest.DeleteLogs)
}

func addCleanupAPIRoutes(r shared.EchoRouter) {
	r.GET("/flows", rest.GetOrphanedFlows, m.ValidatePermission("cleanup.access.flows", policy.PoliceAlways()))
	r.GET("/flows/status", rest.GetOrphanedFlowsStatus, m.ValidatePermission("cleanup.access.flows", policy.PoliceAlways()))
	r.DELETE("/flows", rest.DeleteOrphanedFlows, m.ValidatePermission("cleanup.clean.flows", policy.PoliceAlways()))

	r.GET("/clis", rest.GetOrphanedCLIs, m.ValidatePermission("cleanup.access.clis", policy.PoliceAlways()))
	r.GET("/clis/status", rest.GetOrphanedCLIsStatus, m.ValidatePermission("cleanup.access.clis", policy.PoliceAlways()))
	r.DELETE("/clis", rest.GetOrphanedCLIs, m.ValidatePermission("cleanup.clean.clis", policy.PoliceAlways()))

	r.GET("/sessions", rest.GetOldSessions, m.ValidatePermission("cleanup.access.sessions", policy.PoliceAlways()))
	r.GET("/sessions/status", rest.GetOldSessionsStatus, m.ValidatePermission("cleanup.access.sessions", policy.PoliceAlways()))
	r.DELETE("/sessions", rest.DeleteOldSessions, m.ValidatePermission("cleanup.clean.sessions", policy.PoliceAlways()))

	r.GET("/cleaner", rest.GetCleaner, m.ValidatePermission("cleanup.access.cleaner", policy.PoliceAlways()))
	r.PUT("/cleaner", rest.PutCleaner, m.ValidatePermission("cleanup.update.cleaner", policy.PoliceAlways()))

	r.GET("/processes", rest.GetRunningProcesses, m.ValidatePermission("cleanup.access.processes", policy.PoliceAlways()))
	r.GET("/processes/status", rest.GetRunningProcessesStatus, m.ValidatePermission("cleanup.access.processes", policy.PoliceAlways()))
	r.DELETE("/processes", rest.StopRunningProcess, m.ValidatePermission("cleanup.clean.processes", policy.PoliceAlways()))

	r.GET("/scheduled", rest.GetScheduledJobs, m.ValidatePermission("cleanup.access.scheduled", policy.PoliceAlways()))
	r.GET("/scheduled/status", rest.GetScheduledJobsStatus, m.ValidatePermission("cleanup.access.scheduled", policy.PoliceAlways()))
	r.DELETE("/scheduled", rest.DeleteScheduledJob, m.ValidatePermission("cleanup.clean.scheduled", policy.PoliceAlways()))
}

func addSessionsAPIRoutes(r shared.EchoRouter) {
	r.GET("/summary", rest.GetSessionsPerServerBulked, m.ValidatePermission("sessions.read.others"))

	r.GET("/radius/:server/:bulk", rest.GetSessionsPerBulk(models.ProtosRadius), m.ValidatePermission("sessions.read.others"))
	r.PATCH("/radius/:server", rest.UpdateRadiusSessions, m.ValidatePermission("sessions.update.others"))
	r.PATCH("/radius/:server/:bulk", rest.UpdateRadiusSessions, m.ValidatePermission("sessions.update.others"))
	r.GET("/radius/:server/:bulk/session/:id", rest.GetRadiusSessionDetails, m.ValidatePermission("sessions.read.others"))
	r.GET("/radius/:server/:bulk/guest-data", rest.GetRadiusSessionsGuestData, m.ValidatePermission("sessions.read.others"))
	r.DELETE("/radius/:server", rest.DeleteRadiusSessions, m.ValidatePermission("sessions.delete.others"))
	r.DELETE("/radius/:server/:bulk", rest.DeleteRadiusSessions, m.ValidatePermission("sessions.delete.others"))
	r.GET("/radius", rest.GetRadiusServersBulks, m.ValidatePermission("sessions.read.others"))

	r.GET("/tacacs/:server/:bulk", rest.GetSessionsPerBulk(models.ProtosTacacs), m.ValidatePermission("sessions.read.others"))
	r.DELETE("/tacacs/:server", rest.UpdateTacacsSessions, m.ValidatePermission("sessions.delete.others"))
	r.DELETE("/tacacs/:server/:bulk", rest.UpdateTacacsSessions, m.ValidatePermission("sessions.delete.others"))
	r.GET("/tacacs/:server/:bulk/session/:id", rest.GetTacacsSessionDetails, m.ValidatePermission("sessions.read.others"))

	r.GET("/session-summary/:id", rest.GetSessionSummary, m.ValidatePermission("sessions.read.others"))
}

func addPxGridAPIRoutes(r shared.EchoRouter) {
	r.GET("/status", rest.GetPxGridStatus)

	r.GET("/connections", rest.GetPxGridConnectionsOfUser, m.ValidatePermission("pxgrid.read.others"))
	r.POST("/connections", rest.NewPxGridConnection, m.ValidatePermission("pxgrid.update.others"))

	r.GET("/connections/:connection_id", rest.GetPxGridConnectionOfUser, m.ValidatePermission("pxgrid.read.others"))
	r.DELETE("/connections/:connection_id", rest.DeletePxGridConnection, m.ValidatePermission("pxgrid.delete.others"))
	r.POST("/connections/:connection_id/state", rest.RefreshPxGridConnectionState, m.ValidatePermission("pxgrid.update.others"))
	r.GET("/connections/:connection_id/services", rest.GetPxGridConnectionServices, m.ValidatePermission("pxgrid.read.others"))
	r.GET("/connections/:connection_id/services/:service", rest.GetPxGridConnectionService, m.ValidatePermission("pxgrid.read.others"))
	r.POST("/connections/:connection_id/services/:service/lookup", rest.PxGridConnectionServiceLookup, m.ValidatePermission("pxgrid.update.others"))
	r.POST("/connections/:connection_id/services/:service/update-secrets", rest.PxGridConnectionServiceUpdateSecrets, m.ValidatePermission("pxgrid.update.others"))
	r.POST("/connections/:connection_id/services/:service/check-nodes", rest.PxGridConnectionServiceCheckNodes, m.ValidatePermission("pxgrid.update.others"))
	r.POST("/connections/:connection_id/services/:service/rest", rest.PxGridConnectionServiceREST, m.ValidatePermission("pxgrid.update.others"))
	r.POST("/connections/:connection_id/services/:service/subscriptions", rest.SubscribeToPxGridTopic, m.ValidatePermission("pxgrid.update.others"))
	r.DELETE("/connections/:connection_id/services/:service/subscriptions", rest.UnsubscribeFromPxGridTopic, m.ValidatePermission("pxgrid.update.others"))

	r.GET("/connections/:connection_id/topics", rest.GetPxGridConnectionTopics, m.ValidatePermission("pxgrid.read.others"))

	r.GET("/connections/:connection_id/messages", rest.GetPxGridConnectionMessages, m.ValidatePermission("pxgrid.read.others"))
	r.DELETE("/connections/:connection_id/messages", rest.DeletePxGridConnectionMessages, m.ValidatePermission("pxgrid.delete.others"))

	r.GET("/connections/:connection_id/logs", rest.GetPxGridConnectionLogs, m.ValidatePermission("pxgrid.read.others"))
	r.DELETE("/connections/:connection_id/logs", rest.DeletePxGridConnectionLogs, m.ValidatePermission("pxgrid.delete.others"))

	r.GET("/connections-total", rest.GetPxGridConnectionsOfUserTotal, m.ValidatePermission("pxgrid.read.others"))
}

func addJobsAPIRoutes(r shared.EchoRouter) {
	r.GET("/get-users", rest.GetAllUsersWithJobs, m.ValidatePermission("jobs.read.all_users", policy.PoliceAlways()))

	r.GET("", rest.GetJobsOfUser, m.ValidatePermission("jobs.read.others"))
	r.GET("/:id/stats", rest.GetJobStats, m.ValidatePermission("jobs.read.others"))
	r.DELETE("/:id", rest.DeleteJob, m.ValidatePermission("jobs.delete.others"))
	r.POST("/:id/repeat", rest.RepeatJob, m.ValidatePermission("jobs.repeat.others"))
}

func addUIAPIRoutes(r shared.EchoRouter) {
	r.GET("/me/session", rest.getMySession)
	r.GET("/me/attributes", rest.getMyAttributes)
	r.PUT("/me/attributes", rest.putMyAttributes)
	r.GET("/me/permission", rest.getMyPermission)
}

func addGenerateAPIRoutes(r shared.EchoRouter) {
	r.POST("", rest.Generate, m.ValidatePermission("generate.create.others"))

	r.GET("/proto/:proto/parameters", rest.GetProtoSpecificParams)
	r.GET("/proto/:proto/defaults", rest.GetProtoDefaults, m.ValidatePermission("generate_defaults.read.others"))
	r.GET("/variables/:variable", rest.GetVariableDefinition)
	r.GET("/sources", rest.GetAvailableIPSources)
	r.GET("/radius/dictionaries", rest.GetRadiusDictionaries)
	r.GET("/radius/dictionaries/:name", rest.GetRadiusDictionary)
	r.GET("/tls/ciphers", rest.GetSupportedTLSCipherSuites)
}

func addGlobalConfigAPIRoutes(r shared.EchoRouter) {
	r.GET("", rest.GetGlobalConfig)
	r.PUT("", rest.UpdateGlobalConfig, m.ValidatePermission("global_config.update", policy.PoliceAlways()))

	r.GET("/plugins", rest.GetLoadedPlugins, m.ValidatePermission("plugins.read"))
	r.PATCH("/plugins/:name", rest.UpdatePlugin, m.ValidatePermission("plugins.update"))
}

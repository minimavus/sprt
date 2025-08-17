package queue

type (
	QueueClientName string
)

const (
	QueueClientNameGenerator QueueClientName = "SPRT Generator Service"
	QueueClientNameFrontend  QueueClientName = "SPRT Frontend Service"
)

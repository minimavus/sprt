package queue

type (
	QueueClientName string
)

const (
	QueueClientNameGenerator QueueClientName = "SPRT Generator Service"
	QueueClientNameFrontend  QueueClientName = "SPRT Frontend Service"
)

func NotificationSubQueue(queueName string) string {
	return queueName + ".notification"
}

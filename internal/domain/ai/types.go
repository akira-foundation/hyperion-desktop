package ai

type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type Message struct {
	Role    Role
	Content string
}

type GenerateInput struct {
	Model       string
	Messages    []Message
	MaxTokens   int
	Temperature float64
}

type GenerateOutput struct {
	Content      string
	InputTokens  int
	OutputTokens int
	Model        string
}

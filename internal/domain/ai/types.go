package ai

type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type Message struct {
	Role    Role   `json:"role"`
	Content string `json:"content"`
}

type GenerateInput struct {
	Model     string    `json:"model"`
	System    string    `json:"system"`
	Messages  []Message `json:"messages"`
	MaxTokens int       `json:"maxTokens"`
}

type GenerateOutput struct {
	Content      string `json:"content"`
	InputTokens  int    `json:"inputTokens"`
	OutputTokens int    `json:"outputTokens"`
	CacheRead    int    `json:"cacheRead"`
	CacheWrite   int    `json:"cacheWrite"`
	Model        string `json:"model"`
}

type Capabilities struct {
	Streaming   bool `json:"streaming"`
	Vision      bool `json:"vision"`
	Tools       bool `json:"tools"`
	Thinking    bool `json:"thinking"`
	PromptCache bool `json:"promptCache"`
}

type ModelInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ContextSize int    `json:"contextSize"`
	Default     bool   `json:"default"`
}

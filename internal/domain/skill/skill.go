package skill

type Skill struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Tags        []string `json:"tags"`
}

type RunRequest struct {
	SkillID     string `json:"skillId"`
	ProjectPath string `json:"projectPath"`
	Provider    string `json:"provider"`
}

type RunResult struct {
	OutputDir string         `json:"outputDir"`
	Files     []GeneratedFile `json:"files"`
	Caption   string         `json:"caption"`
	Log       string         `json:"log"`
}

type GeneratedFile struct {
	Path string `json:"path"`
	Kind string `json:"kind"` // html | css | image | other
	Size int64  `json:"size"`
}

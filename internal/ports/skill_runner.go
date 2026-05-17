package ports

import (
	"context"

	"hyperion-desktop/internal/domain/skill"
)

type SkillRegistry interface {
	List() []skill.Skill
	Get(id string) (Skill, error)
}

type Skill interface {
	Meta() skill.Skill
	SystemPrompt() string
}

type SkillRunner interface {
	Run(ctx context.Context, s Skill, req skill.RunRequest) (*skill.RunResult, error)
}

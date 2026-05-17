package application

import (
	"context"
	"fmt"

	skilldom "hyperion-desktop/internal/domain/skill"
	"hyperion-desktop/internal/ports"
)

type SkillService struct {
	registry ports.SkillRegistry
	runner   ports.SkillRunner
}

func NewSkillService(registry ports.SkillRegistry, runner ports.SkillRunner) *SkillService {
	return &SkillService{registry: registry, runner: runner}
}

func (s *SkillService) List() []skilldom.Skill {
	return s.registry.List()
}

func (s *SkillService) Run(ctx context.Context, req skilldom.RunRequest) (*skilldom.RunResult, error) {
	if req.SkillID == "" {
		return nil, fmt.Errorf("skill id required")
	}
	sk, err := s.registry.Get(req.SkillID)
	if err != nil {
		return nil, err
	}
	return s.runner.Run(ctx, sk, req)
}

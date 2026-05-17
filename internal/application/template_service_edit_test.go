package application

import (
	"strings"
	"testing"

	"hyperion-desktop/internal/domain/template"
)

func TestBuildEditPrompt_IncludesUserRequest(t *testing.T) {
	tpl := &template.RuntimeTemplate{
		Size:   template.Size{Width: 1080, Height: 1080},
		Slides: []template.RuntimeSlide{{Index: 0, Filename: "slide-1.html"}},
		Assets: []string{"styles.css"},
	}
	got := buildEditPrompt(tpl, "make the heading bigger")
	if !strings.Contains(got, "make the heading bigger") {
		t.Fatalf("expected user request in prompt, got:\n%s", got)
	}
}

func TestBuildEditPrompt_ListsExistingFiles(t *testing.T) {
	tpl := &template.RuntimeTemplate{
		Size: template.Size{Width: 1080, Height: 1080},
		Slides: []template.RuntimeSlide{
			{Index: 0, Filename: "slide-1.html"},
			{Index: 1, Filename: "slide-2.html"},
		},
		Assets: []string{"styles.css", "logo.svg"},
	}
	got := buildEditPrompt(tpl, "tweak palette")
	for _, name := range []string{"slide-1.html", "slide-2.html", "styles.css", "logo.svg"} {
		if !strings.Contains(got, name) {
			t.Fatalf("expected %q in prompt, got:\n%s", name, got)
		}
	}
}

func TestBuildEditPrompt_EnforcesViewport(t *testing.T) {
	tpl := &template.RuntimeTemplate{Size: template.Size{Width: 1200, Height: 1500}}
	got := buildEditPrompt(tpl, "x")
	if !strings.Contains(got, "1200x1500") {
		t.Fatalf("expected viewport in prompt, got:\n%s", got)
	}
}

func TestBuildEditPrompt_NoEmDash(t *testing.T) {
	tpl := &template.RuntimeTemplate{Size: template.Size{Width: 1080, Height: 1080}}
	got := buildEditPrompt(tpl, "x")
	if strings.Contains(got, "—") {
		t.Fatalf("em-dash detected in prompt prose")
	}
}

func TestEditWithAI_RejectsEmptyID(t *testing.T) {
	svc := &TemplateService{}
	_, err := svc.EditWithAI(nil, EditTemplateInput{ID: "", Prompt: "x"})
	if err == nil {
		t.Fatalf("expected error on empty id")
	}
}

func TestEditWithAI_RejectsEmptyPrompt(t *testing.T) {
	svc := &TemplateService{}
	_, err := svc.EditWithAI(nil, EditTemplateInput{ID: "abc", Prompt: "   "})
	if err == nil {
		t.Fatalf("expected error on blank prompt")
	}
}

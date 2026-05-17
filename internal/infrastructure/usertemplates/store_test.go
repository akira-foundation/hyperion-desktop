package usertemplates

import (
	"os"
	"path/filepath"
	"testing"

	"hyperion-desktop/internal/domain/template"
)

func TestSetGeneration_PersistsAndReadsBack(t *testing.T) {
	dir := t.TempDir()
	store, err := NewStore(dir)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	srcDir := filepath.Join(dir, "src")
	if err := os.MkdirAll(srcDir, 0o755); err != nil {
		t.Fatalf("mkdir src: %v", err)
	}
	if err := os.WriteFile(filepath.Join(srcDir, "slide-1.html"), []byte("<html></html>"), 0o644); err != nil {
		t.Fatalf("write slide: %v", err)
	}

	tpl, err := store.ImportFromFolder(
		srcDir,
		"Original",
		"first generation",
		"Custom",
		"ai-generated",
		template.Size{Width: 1080, Height: 1080},
	)
	if err != nil {
		t.Fatalf("import: %v", err)
	}

	gen := &template.GenerationRecord{
		Prompt:    "make it minimal",
		URLs:      []string{"https://example.com"},
		LocalRefs: []string{"/tmp/ref.png"},
	}
	if err := store.SetGeneration(tpl.ID, gen); err != nil {
		t.Fatalf("set generation: %v", err)
	}

	got, err := store.Get(tpl.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Generation == nil {
		t.Fatalf("expected generation to round-trip, got nil")
	}
	if got.Generation.Prompt != gen.Prompt {
		t.Fatalf("prompt mismatch: %q vs %q", got.Generation.Prompt, gen.Prompt)
	}
	if len(got.Generation.URLs) != 1 || got.Generation.URLs[0] != "https://example.com" {
		t.Fatalf("urls mismatch: %v", got.Generation.URLs)
	}
	if len(got.Generation.LocalRefs) != 1 || got.Generation.LocalRefs[0] != "/tmp/ref.png" {
		t.Fatalf("localRefs mismatch: %v", got.Generation.LocalRefs)
	}
}

func TestSetGeneration_OnMissingID(t *testing.T) {
	dir := t.TempDir()
	store, err := NewStore(dir)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	err = store.SetGeneration("nonexistent", &template.GenerationRecord{Prompt: "x"})
	if err == nil {
		t.Fatalf("expected error on missing id")
	}
}

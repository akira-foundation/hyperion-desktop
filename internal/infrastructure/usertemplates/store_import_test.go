package usertemplates

import (
	"os"
	"path/filepath"
	"testing"

	"hyperion-desktop/internal/domain/template"
)

func TestImportFromFolder_DetectsStoryFormat(t *testing.T) {
	dir := t.TempDir()
	store, err := NewStore(dir)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	src := filepath.Join(dir, "src")
	if err := os.MkdirAll(src, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	for _, name := range []string{"slide-1.html", "slide-1-story.html", "slide-2.html", "slide-2-story.html", "styles.css"} {
		if err := os.WriteFile(filepath.Join(src, name), []byte("<html></html>"), 0o644); err != nil {
			t.Fatalf("write %s: %v", name, err)
		}
	}

	tpl, err := store.ImportFromFolder(src, "Multi", "", "Custom", "ai-generated", template.Size{Width: 1080, Height: 1350})
	if err != nil {
		t.Fatalf("import: %v", err)
	}

	if len(tpl.Slides) != 2 {
		t.Fatalf("expected 2 slides, got %d", len(tpl.Slides))
	}
	for i, s := range tpl.Slides {
		if s.Files == nil {
			t.Fatalf("slide %d missing Files", i)
		}
		if s.Files[template.FormatFeed] == "" || s.Files[template.FormatStory] == "" {
			t.Fatalf("slide %d incomplete files: %+v", i, s.Files)
		}
	}

	hasStory := false
	for _, f := range tpl.Formats {
		if f == template.FormatStory {
			hasStory = true
		}
	}
	if !hasStory {
		t.Fatalf("Formats should include story, got %v", tpl.Formats)
	}

	if tpl.FormatSizes[template.FormatStory].Width != 1080 ||
		tpl.FormatSizes[template.FormatStory].Height != 1920 {
		t.Fatalf("story size wrong: %+v", tpl.FormatSizes[template.FormatStory])
	}
}

func TestImportFromFolder_FeedOnlyOmitsStoryFormat(t *testing.T) {
	dir := t.TempDir()
	store, err := NewStore(dir)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	src := filepath.Join(dir, "src")
	if err := os.MkdirAll(src, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(src, "slide-1.html"), []byte("<html></html>"), 0o644); err != nil {
		t.Fatalf("write: %v", err)
	}

	tpl, err := store.ImportFromFolder(src, "FeedOnly", "", "Custom", "import", template.Size{Width: 1080, Height: 1080})
	if err != nil {
		t.Fatalf("import: %v", err)
	}

	if len(tpl.Formats) != 1 || tpl.Formats[0] != template.FormatFeed {
		t.Fatalf("expected formats=[feed], got %v", tpl.Formats)
	}
	if len(tpl.FormatSizes) != 0 {
		t.Fatalf("expected no FormatSizes, got %+v", tpl.FormatSizes)
	}
}

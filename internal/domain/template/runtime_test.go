package template

import "testing"

func TestFilenameFor_FeedFallback(t *testing.T) {
	tpl := &RuntimeTemplate{
		Slides: []RuntimeSlide{{Index: 0, Filename: "slide-1.html"}},
	}
	if got := tpl.FilenameFor(0, FormatFeed); got != "slide-1.html" {
		t.Fatalf("feed: got %q", got)
	}
	if got := tpl.FilenameFor(0, ""); got != "slide-1.html" {
		t.Fatalf("empty format: got %q", got)
	}
}

func TestFilenameFor_StoryFromFiles(t *testing.T) {
	tpl := &RuntimeTemplate{
		Slides: []RuntimeSlide{{
			Index:    0,
			Filename: "slide-1.html",
			Files: map[Format]string{
				FormatFeed:  "slide-1.html",
				FormatStory: "slide-1-story.html",
			},
		}},
	}
	if got := tpl.FilenameFor(0, FormatStory); got != "slide-1-story.html" {
		t.Fatalf("story: got %q", got)
	}
}

func TestFilenameFor_StoryFallbackToFeedWhenAbsent(t *testing.T) {
	tpl := &RuntimeTemplate{
		Slides: []RuntimeSlide{{Index: 0, Filename: "slide-1.html"}},
	}
	if got := tpl.FilenameFor(0, FormatStory); got != "slide-1.html" {
		t.Fatalf("missing story should fall back to feed, got %q", got)
	}
}

func TestFilenameFor_OutOfRange(t *testing.T) {
	tpl := &RuntimeTemplate{Slides: []RuntimeSlide{{Filename: "slide-1.html"}}}
	if got := tpl.FilenameFor(5, FormatFeed); got != "" {
		t.Fatalf("expected empty for out of range, got %q", got)
	}
	if got := tpl.FilenameFor(-1, FormatFeed); got != "" {
		t.Fatalf("expected empty for negative, got %q", got)
	}
}

func TestSizeFor_FeedReturnsTemplateSize(t *testing.T) {
	tpl := &RuntimeTemplate{Size: Size{Width: 1080, Height: 1350}}
	if got := tpl.SizeFor(FormatFeed); got.Width != 1080 || got.Height != 1350 {
		t.Fatalf("feed: got %+v", got)
	}
}

func TestSizeFor_StoryUsesFormatSizes(t *testing.T) {
	tpl := &RuntimeTemplate{
		Size: Size{Width: 1080, Height: 1350},
		FormatSizes: map[Format]Size{
			FormatStory: {Width: 1080, Height: 1920},
		},
	}
	if got := tpl.SizeFor(FormatStory); got.Width != 1080 || got.Height != 1920 {
		t.Fatalf("story: got %+v", got)
	}
}

func TestSizeFor_StoryFallbackDefault(t *testing.T) {
	tpl := &RuntimeTemplate{Size: Size{Width: 1080, Height: 1350}}
	got := tpl.SizeFor(FormatStory)
	if got.Width != 1080 || got.Height != 1920 {
		t.Fatalf("expected default story 1080x1920, got %+v", got)
	}
}

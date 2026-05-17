package renderserver

import (
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"strings"
)

type Server struct {
	listener net.Listener
	baseURL  string
	mux      *http.ServeMux
}

func New(assets fs.FS) (*Server, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("renderserver listen: %w", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", spaHandler{root: assets})

	go func() {
		_ = http.Serve(ln, mux)
	}()

	addr := ln.Addr().(*net.TCPAddr)
	return &Server{
		listener: ln,
		baseURL:  fmt.Sprintf("http://127.0.0.1:%d", addr.Port),
		mux:      mux,
	}, nil
}

func (s *Server) BaseURL() string { return s.baseURL }

func (s *Server) Close() error {
	return s.listener.Close()
}

// MountUserTemplates serves files from userTemplatesDir under /user-templates/.
// Path style: /user-templates/<slug>/<file>
func (s *Server) MountUserTemplates(userTemplatesDir string) {
	prefix := "/user-templates/"
	s.mux.Handle(prefix, http.StripPrefix(prefix, safeFileServer(userTemplatesDir)))
}

// MountAssets serves generated image assets from assetsDir under /assets/.
func (s *Server) MountAssets(assetsDir string) {
	prefix := "/assets/"
	s.mux.Handle(prefix, http.StripPrefix(prefix, safeFileServer(assetsDir)))
}

func safeFileServer(root string) http.Handler {
	fileSrv := http.FileServer(http.Dir(root))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "..") {
			http.NotFound(w, r)
			return
		}
		fileSrv.ServeHTTP(w, r)
	})
}

type spaHandler struct {
	root fs.FS
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/index.html"
	}
	clean := path[1:]

	f, err := h.root.Open(clean)
	if err != nil {
		index, ierr := h.root.Open("index.html")
		if ierr != nil {
			http.NotFound(w, r)
			return
		}
		defer index.Close()
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeContent(w, r, "index.html", staticModTime, mustReadSeeker(index))
		return
	}
	defer f.Close()

	http.ServeContent(w, r, clean, staticModTime, mustReadSeeker(f))
}

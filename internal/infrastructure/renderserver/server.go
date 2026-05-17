package renderserver

import (
	"fmt"
	"io/fs"
	"net"
	"net/http"
)

type Server struct {
	listener net.Listener
	baseURL  string
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
	}, nil
}

func (s *Server) BaseURL() string { return s.baseURL }

func (s *Server) Close() error {
	return s.listener.Close()
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

package renderserver

import (
	"bytes"
	"io"
	"time"
)

var staticModTime = time.Now()

func mustReadSeeker(r io.Reader) io.ReadSeeker {
	if rs, ok := r.(io.ReadSeeker); ok {
		return rs
	}
	buf, _ := io.ReadAll(r)
	return bytes.NewReader(buf)
}

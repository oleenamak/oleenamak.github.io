#!/usr/bin/env python3
"""
Dev server. Identical to `python3 -m http.server` except it tells the browser
never to cache, so an edit shows up on a plain reload instead of needing
Cmd+Shift+R. Development only — do not deploy this.

    python3 serve.py [port]
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def send_head(self):
        # Drop revalidation headers so a stale browser cache can never win
        # with a 304; every request gets the file as it is on disk.
        for h in ("If-Modified-Since", "If-None-Match"):
            del self.headers[h]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, key, value):
        # drop the validator that lets browsers answer from cache
        if key.lower() == "last-modified":
            return
        super().send_header(key, value)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"serving {__file__.rsplit('/', 1)[0]} at http://localhost:{port}  (no-cache)")
    ThreadingHTTPServer(("", port), NoCache).serve_forever()

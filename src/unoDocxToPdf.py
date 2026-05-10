#!/usr/bin/env python3
import json
import os
import sys
import time

import uno
from com.sun.star.beans import PropertyValue


def prop(name, value):
    item = PropertyValue()
    item.Name = name
    item.Value = value
    return item


def file_url(path):
    return uno.systemPathToFileUrl(os.path.abspath(path))


def connect(host, port, timeout_seconds):
    local_context = uno.getComponentContext()
    resolver = local_context.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver",
        local_context,
    )
    uno_url = "uno:socket,host={host},port={port};urp;StarOffice.ComponentContext".format(
        host=host,
        port=port,
    )
    deadline = time.time() + max(1, float(timeout_seconds or 5))
    last_error = None

    while time.time() < deadline:
        try:
            return resolver.resolve(uno_url)
        except Exception as error:
            last_error = error
            time.sleep(0.15)

    raise RuntimeError("LibreOffice UNO is not ready: {0}".format(last_error))


def convert_one(desktop, input_path, output_path):
    document = None
    try:
        document = desktop.loadComponentFromURL(
            file_url(input_path),
            "_blank",
            0,
            (
                prop("Hidden", True),
                prop("ReadOnly", True),
                prop("UpdateDocMode", 0),
                prop("MacroExecutionMode", 0),
            ),
        )
        if document is None:
            raise RuntimeError("LibreOffice did not open DOCX.")

        document.storeToURL(
            file_url(output_path),
            (
                prop("FilterName", "writer_pdf_Export"),
                prop("Overwrite", True),
            ),
        )
        return {"ok": True, "outputPath": output_path}
    finally:
        if document is not None:
            try:
                document.close(True)
            except Exception:
                try:
                    document.dispose()
                except Exception:
                    pass


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    host = payload.get("host") or "127.0.0.1"
    port = int(payload.get("port") or 2002)
    timeout_seconds = float(payload.get("timeoutSeconds") or 10)
    items = payload.get("items") or []

    context = connect(host, port, timeout_seconds)
    desktop = context.ServiceManager.createInstanceWithContext(
        "com.sun.star.frame.Desktop",
        context,
    )
    results = []

    for item in items:
        input_path = str(item.get("inputPath") or "")
        output_path = str(item.get("outputPath") or "")
        try:
            if not input_path or not output_path:
                raise RuntimeError("Missing input or output path.")
            results.append(convert_one(desktop, input_path, output_path))
        except Exception as error:
            results.append({
                "ok": False,
                "inputPath": input_path,
                "outputPath": output_path,
                "error": str(error),
            })

    print(json.dumps({"results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()

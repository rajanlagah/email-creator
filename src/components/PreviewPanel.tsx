interface Props {
  html: string;
}

export default function PreviewPanel({ html }: Props) {
  return (
    <div className="preview-panel">
      <div className="preview-label">Live Preview</div>
      <iframe
        className="preview-iframe"
        srcDoc={html}
        title="Email Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

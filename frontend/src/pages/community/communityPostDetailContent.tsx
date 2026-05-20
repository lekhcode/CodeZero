import type { ReactNode } from "react";
import {
  parseContentBlocks,
  splitInlineCode,
  type ContentBlock,
} from "./communityPostDetail.utils";
import styles from "./CommunityPostDetail.module.css";

function renderInlineSpans(text: string): ReactNode[] {
  return splitInlineCode(text).map((seg, i) =>
    seg.type === "code" ? (
      <code key={i} className={styles.inlineCode}>
        {seg.value}
      </code>
    ) : (
      <span key={i}>{seg.value}</span>
    ),
  );
}

export function PostBodyContent({ content }: { content: string }) {
  const blocks = parseContentBlocks(content);
  return (
    <div className={styles.postBody}>
      {blocks.map((block, i) => (
        <ContentBlockView key={i} block={block} />
      ))}
    </div>
  );
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  if (block.kind === "code") {
    return <pre className={styles.codeBlock}>{block.text}</pre>;
  }
  return <p className={styles.paragraph}>{renderInlineSpans(block.text)}</p>;
}

export function CommentBodyContent({ content }: { content: string }) {
  return <div className={styles.commentBody}>{renderInlineSpans(content)}</div>;
}

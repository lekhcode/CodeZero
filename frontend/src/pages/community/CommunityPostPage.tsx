import {
  IconArrowLeft,
  IconBold,
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconCode,
  IconCornerDownRight,
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconLink,
  IconMessage,
  IconShare2,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { wrapSelection } from "@/components/forum/forumComposerUtils";
import { queryKeys } from "@/hooks/queryKeys";
import { forumService } from "@/services/forum.service";
import { useAuthStore } from "@/store/authStore";
import type { ForumComment, ForumPostDetail } from "@/types/forum.types";
import { handleSolveButtonMouseMove } from "@/utils/solveButtonRipple";
import { CommentBodyContent, PostBodyContent } from "./communityPostDetailContent";
import {
  authorDisplayName,
  authorInitial,
  categoryBadgeVariant,
  estimateReadMinutes,
  extractHashtags,
  truncateText,
  type CategoryBadgeVariant,
} from "./communityPostDetail.utils";
import styles from "./CommunityPostDetail.module.css";

dayjs.extend(relativeTime);

type CommentNode = ForumComment & { children: CommentNode[] };

function buildTree(comments: ForumComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of comments) {
    byId.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function sortTree(nodes: CommentNode[], order: "newest" | "oldest"): CommentNode[] {
  const cmp =
    order === "newest"
      ? (a: CommentNode, b: CommentNode) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (a: CommentNode, b: CommentNode) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return [...nodes]
    .sort(cmp)
    .map((n) => ({ ...n, children: sortTree(n.children, order) }));
}

function categoryLabel(variant: CategoryBadgeVariant): string {
  if (variant === "question") return "Question";
  if (variant === "solution") return "Solution";
  return "Discussion";
}

const badgeClass: Record<CategoryBadgeVariant, string> = {
  discussion: styles.badgeDiscussion,
  question: styles.badgeQuestion,
  solution: styles.badgeSolution,
};

function CommentCard({
  node,
  depth,
  postId,
  index,
  commentSort,
}: {
  node: CommentNode;
  depth: number;
  postId: string;
  index: number;
  commentSort: "newest" | "oldest";
}) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(node.likedByMe);
  const [likeCount, setLikeCount] = useState(node.likeCount);
  const [heartPop, setHeartPop] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLiked(node.likedByMe);
    setLikeCount(node.likeCount);
  }, [node.likedByMe, node.likeCount]);

  const likeMutation = useMutation({
    mutationFn: () => forumService.toggleCommentLike(node.id),
    onSuccess: (result) => {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumComments(postId) });
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => forumService.createComment(postId, replyText.trim(), node.id),
    onSuccess: () => {
      setReplyText("");
      setReplyOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumComments(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumPost(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumHub });
    },
  });

  const handleLike = () => {
    setHeartPop(true);
    window.setTimeout(() => setHeartPop(false), 250);
    likeMutation.mutate();
  };

  const name = authorDisplayName(node.author);
  const username = node.author.username ? `@${node.author.username}` : null;
  const isNested = depth > 0;
  const cardClass = isNested ? styles.replyCard : styles.commentCard;

  return (
    <FadeInCard delay={index * 0.06} className={cardClass}>
      <article>
        <div className={styles.commentHeader}>
          <div className={`${styles.avatar} ${styles.avatarSm}`} aria-hidden>
            {authorInitial(node.author)}
          </div>
          <span className={styles.displayName}>{name}</span>
          {username && <span className={styles.username}>{username}</span>}
          <span className={styles.commentHeaderSpacer} />
          <time className={styles.commentTime} dateTime={node.createdAt}>
            {dayjs(node.createdAt).fromNow()}
          </time>
          <button type="button" className={styles.moreBtn} aria-label="More options">
            <IconDots size={14} stroke={1.5} />
          </button>
        </div>

        <CommentBodyContent content={node.content} />

        <div className={styles.commentFooter}>
          <button
            type="button"
            className={`${styles.miniLike} ${liked ? styles.miniLikeActive : ""}`}
            onClick={handleLike}
            disabled={likeMutation.isPending}
            aria-label="Like comment"
          >
            <span className={heartPop ? styles.heartPop : undefined}>
              {liked ? (
                <IconHeartFilled size={13} stroke={1.5} />
              ) : (
                <IconHeart size={13} stroke={1.5} />
              )}
            </span>
            <AnimatedNumber value={likeCount} duration={400} />
          </button>
          <button
            type="button"
            className={styles.replyLink}
            onClick={() => setReplyOpen((o) => !o)}
            aria-expanded={replyOpen}
          >
            <IconCornerDownRight size={13} stroke={1.5} />
            Reply
          </button>
        </div>

        <div
          className={`${styles.replyComposerWrap} ${replyOpen ? styles.replyComposerWrapOpen : ""}`}
        >
          <div className={styles.inlineReplyComposer}>
            <textarea
              ref={replyRef}
              className={styles.composerTextarea}
              rows={2}
              placeholder="Write a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              aria-label="Reply to comment"
            />
            <div className={styles.composerBottom}>
              <span />
              <button
                type="button"
                className={`${styles.postCommentBtn} solve-btn`}
                disabled={replyText.trim().length < 2 || replyMutation.isPending}
                onMouseMove={handleSolveButtonMouseMove}
                onClick={() => replyMutation.mutate()}
              >
                {replyMutation.isPending ? "Posting…" : "Post reply"}
              </button>
            </div>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className={styles.nestedReplies}>
            {sortTree(node.children, commentSort).map((child, ci) => (
              <CommentCard
                key={child.id}
                node={child}
                depth={depth + 1}
                postId={postId}
                index={ci}
                commentSort={commentSort}
              />
            ))}
          </div>
        )}
      </article>
    </FadeInCard>
  );
}

function PostDetailView({ post, postId }: { post: ForumPostDetail; postId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const commentsQuery = useQuery({
    queryKey: queryKeys.forumComments(postId),
    queryFn: () => forumService.listComments(postId),
    enabled: postId.length > 0,
  });

  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [heartPop, setHeartPop] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentSort, setCommentSort] = useState<"newest" | "oldest">("newest");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLiked(post.likedByMe);
    setLikeCount(post.likeCount);
  }, [post.likedByMe, post.likeCount]);

  const likeMutation = useMutation({
    mutationFn: () => forumService.togglePostLike(postId),
    onSuccess: (result) => {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumPost(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumHub });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: () => forumService.createComment(postId, commentContent.trim()),
    onSuccess: () => {
      setCommentContent("");
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumComments(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumPost(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumHub });
    },
  });

  const { body, tags } = useMemo(() => extractHashtags(post.content), [post.content]);
  const readMin = estimateReadMinutes(body);
  const badgeVariant = categoryBadgeVariant(post.type);
  const authorName = authorDisplayName(post.author);
  const authorHandle = post.author.username ? `@${post.author.username}` : null;
  const navTitle = truncateText(post.title, 40);

  const commentTree = useMemo(() => {
    const items = commentsQuery.data?.items ?? [];
    return sortTree(buildTree(items), commentSort);
  }, [commentsQuery.data?.items, commentSort]);

  const commentCount = commentsQuery.data?.items.length ?? post.commentCount;

  const currentUserInitial = user
    ? authorInitial({ name: user.name ?? user.fullName, email: user.email })
    : "?";

  const handlePostLike = () => {
    setHeartPop(true);
    window.setTimeout(() => setHeartPop(false), 250);
    likeMutation.mutate();
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, [post.title]);

  const wrapCode = () => {
    const el = composerRef.current;
    if (!el) return;
    setCommentContent((v) => wrapSelection(el, v, "`", "`"));
  };

  const wrapBold = () => {
    const el = composerRef.current;
    if (!el) return;
    setCommentContent((v) => wrapSelection(el, v, "**", "**"));
  };

  return (
    <div className={styles.page}>
      <header className={styles.subNav}>
        <button
          type="button"
          className={styles.subNavBack}
          onClick={() => navigate("/community")}
          aria-label="Back to Community"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          Community
        </button>
        <span className={styles.subNavSep}>/</span>
        <span className={styles.subNavTitle} title={post.title}>
          {navTitle}
        </span>
        <span className={styles.subNavSpacer} />
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => void handleShare()}
          aria-label="Share post"
        >
          <IconShare2 size={16} stroke={1.5} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${bookmarked ? styles.iconBtnActive : ""}`}
          onClick={() => setBookmarked((b) => !b)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
          aria-pressed={bookmarked}
        >
          {bookmarked ? (
            <IconBookmarkFilled size={16} stroke={1.5} />
          ) : (
            <IconBookmark size={16} stroke={1.5} />
          )}
        </button>
      </header>

      <article className={styles.postCard}>
        <div className={styles.postHeader}>
          <div className={styles.avatar} aria-hidden>
            {authorInitial(post.author)}
          </div>
          <div className={styles.authorMeta}>
            <div className={styles.authorRow1}>
              <span className={styles.displayName}>{authorName}</span>
              {authorHandle && <span className={styles.username}>{authorHandle}</span>}
            </div>
            <div className={styles.authorRow2}>
              {dayjs(post.createdAt).format("MMM D, YYYY")}
              <span> · </span>
              {dayjs(post.createdAt).fromNow()}
              <span> · </span>
              ~{readMin} min read
            </div>
          </div>
          <span className={`${styles.categoryBadge} ${badgeClass[badgeVariant]}`}>
            {categoryLabel(badgeVariant)}
          </span>
        </div>

        <div className={styles.divider} role="separator" />

        <h1 className={styles.postTitle}>{post.title}</h1>
        <PostBodyContent content={body} />

        {post.externalLink && (
          <a
            className={styles.externalLink}
            href={post.externalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconLink size={16} stroke={1.5} />
            {post.linkHost ?? post.externalLink}
          </a>
        )}

        {tags.length > 0 && (
          <div className={styles.tagsRow}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <section className={styles.reactionsBar} aria-label="Post reactions">
        <div className={styles.reactionsLeft}>
          <button
            type="button"
            className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
            onClick={handlePostLike}
            disabled={likeMutation.isPending}
            aria-label="Like post"
            aria-pressed={liked}
          >
            <span className={heartPop ? styles.heartPop : undefined}>
              {liked ? (
                <IconHeartFilled size={15} stroke={1.5} />
              ) : (
                <IconHeart size={15} stroke={1.5} />
              )}
            </span>
            <AnimatedNumber value={likeCount} duration={400} />
          </button>
          <span className={styles.statChip}>
            <IconMessage size={15} stroke={1.5} />
            <AnimatedNumber value={commentCount} duration={400} />
          </span>
        </div>
        <span className={styles.reactionsSpacer} />
        <button type="button" className={styles.shareBtn} onClick={() => void handleShare()}>
          <IconShare2 size={14} stroke={1.5} />
          Share
        </button>
      </section>

      <section className={styles.composerSection} aria-labelledby="composer-heading">
        <h2 id="composer-heading" className={styles.composerHeading}>
          Add your thoughts
        </h2>
        <div
          className={`${styles.composerCard} ${composerFocused ? styles.composerCardFocused : ""}`}
        >
          <div className={styles.composerTop}>
            <div className={`${styles.avatar} ${styles.avatarXs}`} aria-hidden>
              {currentUserInitial}
            </div>
            <textarea
              ref={composerRef}
              className={styles.composerTextarea}
              placeholder="Share your insight, hint, or experience..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              aria-label="Write a comment"
            />
          </div>
          <div className={styles.composerBottom}>
            <div className={styles.formatHints}>
              <button
                type="button"
                className={styles.formatBtn}
                title="Wrap in backticks for code"
                onClick={wrapCode}
                aria-label="Insert code formatting"
              >
                <IconCode size={16} stroke={1.5} />
              </button>
              <button
                type="button"
                className={styles.formatBtn}
                title="Wrap selection in bold markers"
                onClick={wrapBold}
                aria-label="Bold formatting"
              >
                <IconBold size={16} stroke={1.5} />
              </button>
            </div>
            <button
              type="button"
              className={`${styles.postCommentBtn} solve-btn`}
              disabled={
                commentContent.trim().length < 2 || createCommentMutation.isPending
              }
              onMouseMove={handleSolveButtonMouseMove}
              onClick={() => createCommentMutation.mutate()}
            >
              {createCommentMutation.isPending ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.commentsSection} aria-labelledby="discussion-heading">
        <div className={styles.commentsHeader}>
          <span id="discussion-heading" className={styles.commentsLabel}>
            Discussion
          </span>
          <span className={styles.countBadge}>{commentCount}</span>
          <span className={styles.commentsSpacer} />
          {commentCount > 1 && (
            <button
              type="button"
              className={styles.sortBtn}
              onClick={() =>
                setCommentSort((s) => (s === "newest" ? "oldest" : "newest"))
              }
              aria-label="Sort comments"
            >
              {commentSort === "newest" ? "Newest first" : "Oldest first"}
              <IconChevronDown size={14} stroke={1.5} />
            </button>
          )}
        </div>

        {commentsQuery.isLoading && <LoadingSkeleton count={2} />}

        {!commentsQuery.isLoading && commentTree.length === 0 && (
          <div className={styles.emptyComments}>
            <IconMessage size={28} stroke={1.25} aria-hidden />
            <p className={styles.emptyPrimary}>No comments yet.</p>
            <p className={styles.emptySecondary}>Be the first to share an insight.</p>
          </div>
        )}

        {commentTree.map((node, i) => (
          <CommentCard
            key={node.id}
            node={node}
            depth={0}
            postId={postId}
            index={i}
            commentSort={commentSort}
          />
        ))}
      </section>
    </div>
  );
}

export function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = id ?? "";

  const postQuery = useQuery({
    queryKey: queryKeys.forumPost(postId),
    queryFn: () => forumService.getPost(postId),
    enabled: postId.length > 0,
  });

  return (
    <FixedPageShell
      sx={{
        bgcolor: "#100b07",
        px: 0,
        py: 0,
        maxWidth: "100%",
        mx: 0,
      }}
    >
      <ScrollRegion sx={{ px: 0 }}>
        {postQuery.isLoading && (
          <div className={styles.page}>
            <LoadingSkeleton count={3} />
          </div>
        )}
        {postQuery.data && <PostDetailView post={postQuery.data} postId={postId} />}
      </ScrollRegion>
    </FixedPageShell>
  );
}

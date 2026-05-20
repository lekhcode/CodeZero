import {
  IconBold,
  IconBulb,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconHelpCircle,
  IconItalic,
  IconLink,
  IconList,
  IconLock,
  IconMessageCircle,
  IconQuote,
  IconRocket,
  IconSend,
  IconTrophy,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import styles from "./ForumPostComposer.module.css";
import {
  autoResizeTextarea,
  insertAtCursor,
  prependLines,
  wrapSelection,
} from "./forumComposerUtils";
import { useAuthStore } from "@/store/authStore";
import { forumService } from "@/services/forum.service";
import type { ForumPostType } from "@/types/forum.types";
import { authorDisplayName, authorInitials } from "@/utils/forumAuthor";
import {
  EMOJI_CATEGORIES,
  EMOJI_SETS,
  type EmojiCategoryKey,
} from "./forumEmojiData";

const CHAR_LIMIT = 2000;
const CHAR_WARN = 1800;
const MAX_TAGS = 3;

type ComposerTypeKey = "discussion" | "tip" | "question" | "achievement" | "resource";
type VisibilityKey = "public" | "friends" | "only_me";

const COMPOSER_TYPES: Array<{
  key: ComposerTypeKey;
  label: string;
  Icon: typeof IconMessageCircle;
}> = [
  { key: "discussion", label: "Discussion", Icon: IconMessageCircle },
  { key: "tip", label: "Tip", Icon: IconBulb },
  { key: "question", label: "Question", Icon: IconHelpCircle },
  { key: "achievement", label: "Achievement", Icon: IconTrophy },
  { key: "resource", label: "Resource", Icon: IconRocket },
];

const TYPE_TO_API: Record<ComposerTypeKey, ForumPostType> = {
  discussion: "DISCUSSION",
  tip: "GUIDE",
  question: "QUESTION",
  achievement: "INTERVIEW_EXPERIENCE",
  resource: "RESOURCE",
};

const TAG_OPTIONS = [
  "DSA",
  "Tips",
  "Hot",
  "CP",
  "Concepts",
  "Interview",
  "Discuss",
  "Beginner",
  "LC Hard",
] as const;

const VISIBILITY_OPTIONS: Array<{
  key: VisibilityKey;
  label: string;
  Icon: typeof IconWorld;
}> = [
  { key: "public", label: "Public", Icon: IconWorld },
  { key: "friends", label: "Friends", Icon: IconUsers },
  { key: "only_me", label: "Only Me", Icon: IconLock },
];

function appendTagsToContent(body: string, tags: string[]): string {
  const trimmed = body.trim();
  if (tags.length === 0) return trimmed;
  const tagLine = tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
  return `${trimmed}\n\n${tagLine}`;
}

function resetFormState(
  setTitle: (v: string) => void,
  setContent: (v: string) => void,
  setComposerType: (v: ComposerTypeKey) => void,
  setType: (v: ForumPostType) => void,
  setTags: (v: string[]) => void,
  setVisibility: (v: VisibilityKey) => void,
): void {
  setTitle("");
  setContent("");
  setComposerType("discussion");
  setType("DISCUSSION");
  setTags([]);
  setVisibility("public");
}

export function ForumPostComposer({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  const visibilityWrapRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<ForumPostType>("DISCUSSION");
  const [composerType, setComposerType] = useState<ComposerTypeKey>("discussion");
  const [tags, setTags] = useState<string[]>([]);
  const [tagShake, setTagShake] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityKey>("public");
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategoryKey>("smileys");
  const [expanded, setExpanded] = useState(!compact);

  const createMutation = useMutation({
    mutationFn: () =>
      forumService.createPost({
        title: title.trim(),
        content: appendTagsToContent(content, tags),
        type,
      }),
    onSuccess: () => {
      resetFormState(setTitle, setContent, setComposerType, setType, setTags, setVisibility);
      if (compact) setExpanded(false);
      void queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });

  const bodyLength = content.length;
  const isPostDisabled =
    title.trim().length === 0 ||
    content.trim().length === 0 ||
    bodyLength > CHAR_LIMIT ||
    createMutation.isPending;

  const handleCancel = useCallback(() => {
    resetFormState(setTitle, setContent, setComposerType, setType, setTags, setVisibility);
    setEmojiPickerOpen(false);
    setVisibilityOpen(false);
    if (compact) setExpanded(false);
  }, [compact]);

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    setEmojiPickerOpen(false);
    setVisibilityOpen(false);
  }, []);

  const selectComposerType = (key: ComposerTypeKey) => {
    setComposerType(key);
    setType(TYPE_TO_API[key]);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) {
        setTagShake(true);
        window.setTimeout(() => setTagShake(false), 200);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleTitleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    autoResizeTextarea(e.target);
  };

  const handleContentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    autoResizeTextarea(e.target);
  };

  const withContentRef = (fn: (el: HTMLTextAreaElement) => void) => {
    const el = contentRef.current;
    if (el === null) return;
    fn(el);
  };

  const insertEmoji = (emoji: string) => {
    const el = contentRef.current;
    if (el === null) {
      setContent((c) => `${c}${emoji}`);
    } else {
      setContent((c) => insertAtCursor(el, emoji, c));
    }
    setEmojiPickerOpen(false);
    requestAnimationFrame(() => autoResizeTextarea(contentRef.current));
  };

  useEffect(() => {
    if (!expanded) return;
    autoResizeTextarea(titleRef.current);
    autoResizeTextarea(contentRef.current);
  }, [title, content, expanded]);

  useEffect(() => {
    if (!expanded) return;
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [expanded]);

  useEffect(() => {
    if (!emojiPickerOpen && !visibilityOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiPickerOpen && emojiWrapRef.current !== null && !emojiWrapRef.current.contains(target)) {
        setEmojiPickerOpen(false);
      }
      if (
        visibilityOpen &&
        visibilityWrapRef.current !== null &&
        !visibilityWrapRef.current.contains(target)
      ) {
        setVisibilityOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [emojiPickerOpen, visibilityOpen]);

  if (user === null) {
    return (
      <p className={styles.signIn}>
        <RouterLink to="/login" className={styles.signInLink}>
          Sign in
        </RouterLink>{" "}
        to share with the community.
      </p>
    );
  }

  const displayName = authorDisplayName(user.name, user.email);
  const initials = authorInitials(user.name, user.email);
  const activeVisibility = VISIBILITY_OPTIONS.find((v) => v.key === visibility) ?? VISIBILITY_OPTIONS[0]!;
  const hasDraft = title.trim().length > 0 || content.trim().length > 0;

  const cardClass = [
    styles.card,
    compact ? styles.cardCompact : "",
    !compact || expanded ? styles.cardExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  const collapsedShellClass = `${styles.animShell} ${expanded ? styles.animShellClosed : ""}`;
  const expandedShellClass = `${styles.animShell} ${compact && !expanded ? styles.animShellClosed : ""}`;

  const expandedPanel = (
    <>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.avatar} aria-hidden>
            {initials}
          </div>
          <div className={styles.headerText}>
            <span className={styles.username}>{displayName}</span>
            {!compact && (
              <span className={styles.subtitle}>Sharing with the community</span>
            )}
          </div>
        </div>
        {compact && (
          <button
            type="button"
            className={styles.toggleBtn}
            aria-label="Collapse composer"
            aria-expanded
            onClick={handleCollapse}
          >
            <IconChevronUp
              className={`${styles.toggleIcon} ${styles.toggleIconOpen}`}
              stroke={1.75}
            />
          </button>
        )}
      </header>

      <div className={styles.pillRow} role="tablist" aria-label="Post type">
        {COMPOSER_TYPES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={composerType === key}
            className={`${styles.pill} ${composerType === key ? styles.pillActive : ""}`}
            onClick={() => selectComposerType(key)}
          >
            <Icon className={styles.pillIcon} stroke={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <textarea
          ref={titleRef}
          className={styles.titleInput}
          placeholder="Give your post a title..."
          value={title}
          onChange={handleTitleInput}
          rows={1}
          aria-label="Post title"
        />
        <textarea
          ref={contentRef}
          className={styles.bodyInput}
          placeholder="What's on your mind? Share an insight, a struggle, or a win..."
          value={content}
          onChange={handleContentInput}
          rows={compact ? 2 : 3}
          aria-label="Post body"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.toolbar} aria-label="Formatting">
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            title="Bold"
            onClick={() =>
              withContentRef((el) => setContent((c) => wrapSelection(el, c, "**", "**")))
            }
          >
            <IconBold className={styles.toolIcon} stroke={1.75} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            title="Italic"
            onClick={() =>
              withContentRef((el) => setContent((c) => wrapSelection(el, c, "_", "_")))
            }
          >
            <IconItalic className={styles.toolIcon} stroke={1.75} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            title="Code"
            onClick={() =>
              withContentRef((el) => setContent((c) => wrapSelection(el, c, "`", "`")))
            }
          >
            <IconCode className={styles.toolIcon} stroke={1.75} />
          </button>
        </div>

        <span className={styles.toolSep} aria-hidden />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            title="List"
            onClick={() =>
              withContentRef((el) => setContent((c) => prependLines(el, c, "- ")))
            }
          >
            <IconList className={styles.toolIcon} stroke={1.75} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            title="Quote"
            onClick={() =>
              withContentRef((el) => setContent((c) => prependLines(el, c, "> ")))
            }
          >
            <IconQuote className={styles.toolIcon} stroke={1.75} />
          </button>
        </div>

        <span className={styles.toolSep} aria-hidden />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            title="Link"
            onClick={() => {
              const url = window.prompt("Enter URL");
              if (url === null || url.trim() === "") return;
              withContentRef((el) =>
                setContent((c) => wrapSelection(el, c, "[", `](${url.trim()})`)),
              );
            }}
          >
            <IconLink className={styles.toolIcon} stroke={1.75} />
          </button>
        </div>

        <span className={styles.toolSep} aria-hidden />

        <div className={styles.emojiWrap} ref={emojiWrapRef}>
          <button
            type="button"
            className={styles.toolBtn}
            title="Emoji"
            aria-expanded={emojiPickerOpen}
            onClick={() => setEmojiPickerOpen((o) => !o)}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>😊</span>
          </button>
          {emojiPickerOpen && (
            <div className={styles.emojiPopover} role="dialog" aria-label="Emoji picker">
              <div className={styles.emojiCategories}>
                {EMOJI_CATEGORIES.map(({ key, icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.emojiCatBtn} ${emojiCategory === key ? styles.emojiCatBtnActive : ""}`}
                    onClick={() => setEmojiCategory(key)}
                    aria-label={key}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className={styles.emojiGrid}>
                {EMOJI_SETS[emojiCategory].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.emojiCell}
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.tagsRow} ${tagShake ? styles.tagShake : ""}`}>
        <span className={styles.tagsLabel}>Tags:</span>
        {TAG_OPTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`${styles.tag} ${tags.includes(tag) ? styles.tagActive : ""}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.visibilityWrap} ref={visibilityWrapRef}>
            <button
              type="button"
              className={styles.visibilityBtn}
              aria-expanded={visibilityOpen}
              onClick={() => setVisibilityOpen((o) => !o)}
            >
              <activeVisibility.Icon className={styles.visibilityIcon} stroke={1.75} />
              {activeVisibility.label}
            </button>
            {visibilityOpen && (
              <div className={styles.visibilityMenu} role="menu">
                {VISIBILITY_OPTIONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    className={`${styles.visibilityOption} ${visibility === key ? styles.visibilityOptionActive : ""}`}
                    onClick={() => {
                      setVisibility(key);
                      setVisibilityOpen(false);
                    }}
                  >
                    <Icon className={styles.visibilityIcon} stroke={1.75} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span
            className={`${styles.charCount} ${bodyLength > CHAR_WARN ? styles.charCountWarn : ""}`}
          >
            {bodyLength} / {CHAR_LIMIT}
          </span>
        </div>

        <div className={styles.footerRight}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.postBtn}
            disabled={isPostDisabled}
            onClick={() => createMutation.mutate()}
          >
            <IconSend className={styles.postIcon} stroke={1.75} />
            {createMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </footer>

      {createMutation.isError && (
        <p className={styles.error}>
          Could not publish. Check title (4+ chars) and body (8+ chars).
        </p>
      )}
    </>
  );

  return (
    <article className={cardClass}>
      {compact && (
        <div className={collapsedShellClass} aria-hidden={expanded}>
          <div className={styles.animInner}>
            <div className={styles.collapsedRow}>
              <div className={styles.avatar} aria-hidden>
                {initials}
              </div>
              <button
                type="button"
                className={styles.collapsedPrompt}
                onClick={() => setExpanded(true)}
              >
                {hasDraft
                  ? "Continue your post…"
                  : "Share a question, tip, or win with the community…"}
              </button>
              <button
                type="button"
                className={styles.toggleBtn}
                aria-label="Expand composer"
                aria-expanded={false}
                onClick={() => setExpanded(true)}
              >
                <IconChevronDown className={styles.toggleIcon} stroke={1.75} />
              </button>
            </div>
          </div>
        </div>
      )}

      {compact ? (
        <div className={expandedShellClass} aria-hidden={!expanded}>
          <div className={styles.animInner}>{expandedPanel}</div>
        </div>
      ) : (
        expandedPanel
      )}
    </article>
  );
}

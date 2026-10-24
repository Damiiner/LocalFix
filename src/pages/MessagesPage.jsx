import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const MAX_MESSAGE_IMAGE_BYTES = 450_000;

function peerLabel(conversation) {
  return conversation.peerName || conversation.helperName || "Contact";
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!String(file.type || "").startsWith("image/")) {
      reject(new Error("Only image files are allowed."));
      return;
    }
    if (file.size > MAX_MESSAGE_IMAGE_BYTES) {
      reject(new Error(`Image too large (max ~${Math.round(MAX_MESSAGE_IMAGE_BYTES / 1000)} KB).`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function MessagesPage({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  currentUserName,
  onMarkConversationRead
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [attachError, setAttachError] = useState("");
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0];

  useEffect(() => {
    const helperId = searchParams.get("helper");
    const taskId = searchParams.get("task");
    if (!conversations.length) {
      return;
    }
    if (helperId) {
      const match = conversations.find((conversation) => conversation.helperId === helperId);
      if (match) {
        onSelectConversation(match.id);
        setSearchParams({}, { replace: true });
      }
      return;
    }
    if (taskId) {
      const match = conversations.find((conversation) => conversation.taskId === taskId);
      if (match) {
        onSelectConversation(match.id);
        setSearchParams({}, { replace: true });
        requestAnimationFrame(() => {
          composerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
    }
  }, [searchParams, conversations, onSelectConversation, setSearchParams]);

  useEffect(() => {
    if (activeConversation?.id && onMarkConversationRead) {
      onMarkConversationRead(activeConversation.id);
    }
  }, [activeConversation?.id, onMarkConversationRead]);

  if (!activeConversation) {
    return (
      <section className="messages-page-empty">
        <h2>Messages</h2>
        <p className="muted">No conversations yet.</p>
      </section>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    if (!text.trim() && !imagePreview) {
      return;
    }
    setIsSending(true);
    onSendMessage(activeConversation.id, text.trim(), { imageDataUrl: imagePreview || undefined })
      .then((res) => {
        if (res?.ok !== false) {
          setText("");
          setImagePreview("");
          setAttachError("");
        }
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const otherName = peerLabel(activeConversation);
  const unreadFromPeer = activeConversation.messages.some(
    (m) => m.from !== currentUserName && m.read === false
  );

  return (
    <section className="grid messages-layout messages-page">
      <aside className="card conversation-list" aria-label="Conversations">
        <h3>Inbox</h3>
        {conversations.map((conversation) => {
          const unread = conversation.messages.some(
            (m) => m.from !== currentUserName && m.read === false
          );
          return (
            <button
              key={conversation.id}
              type="button"
              className={`conversation-item ${
                conversation.id === activeConversation.id ? "conversation-item-active" : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <strong>{peerLabel(conversation)}</strong>
              {unread ? <span className="conversation-unread-dot" aria-label="Unread" /> : null}
              <span>{conversation.taskTitle}</span>
            </button>
          );
        })}
      </aside>

      <div className="messages-thread">
        <header className="messages-thread-head">
          <h2>Messages</h2>
          <p className="muted messages-thread-sub">
            {activeConversation.peerKind === "requester"
              ? `Task requester — ${otherName}`
              : `Helper — ${otherName}`}
            {unreadFromPeer ? <span className="messages-read-hint"> · Marked read when you view this thread</span> : null}
          </p>
        </header>

        <div className="card message-box" role="log" aria-live="polite" aria-relevant="additions">
          {activeConversation.messages.map((message) => {
            const mine = message.from === currentUserName;
            const showUnread = !mine && message.read === false;
            return (
              <div key={message.id} className={`message-row${mine ? " message-row--mine" : ""}`}>
                <div className="message-row-head">
                  <strong>{message.from}</strong>
                  {showUnread ? (
                    <span className="message-unread-pill" aria-label="Unread message">
                      New
                    </span>
                  ) : null}
                </div>
                {message.content ? <span className="message-body">{message.content}</span> : null}
                {message.imageDataUrl ? (
                  <a
                    href={message.imageDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="message-image-link"
                  >
                    <img src={message.imageDataUrl} alt="Attachment" className="message-inline-img" />
                  </a>
                ) : null}
                <small className="message-time">{message.time}</small>
              </div>
            );
          })}
        </div>

        <form className="composer" onSubmit={submit} ref={composerRef}>
          {attachError ? <p className="form-error">{attachError}</p> : null}
          {imagePreview ? (
            <div className="composer-attach-preview">
              <img src={imagePreview} alt="" className="composer-preview-thumb" />
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setImagePreview("")}>
                Remove image
              </button>
            </div>
          ) : null}
          <div className="composer-row">
            <input
              className="composer-text-input"
              placeholder="Write a message…"
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={isSending}
              aria-label="Message text"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="visually-hidden"
              aria-label="Attach image"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setAttachError("");
                try {
                  const url = await readImageFile(file);
                  setImagePreview(url);
                } catch (err) {
                  setAttachError(err?.message || "Could not attach.");
                }
              }}
            />
            <div className="composer-send-group">
              <button className="btn" type="submit" disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </button>
              <button
                type="button"
                className="btn btn-secondary composer-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                Photo
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default MessagesPage;

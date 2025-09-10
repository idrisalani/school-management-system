//@ts-nocheck

//teacher/components/assignments/shared/CommentThread.jsx
import React, { useState, useRef } from "react";
import { Send, Edit2, Trash2, Reply, MoreVertical, Smile } from "lucide-react";

const CommentThread = ({
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReplyToComment,
  currentUser,
  disabled = false,
}) => {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyText, setReplyText] = useState("");
  const commentInputRef = useRef(null);

  // Format date relative to now
  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment({
      text: newComment,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
    });

    setNewComment("");
  };

  const handleSubmitEdit = (commentId) => {
    if (!editText.trim()) return;

    onEditComment(commentId, {
      text: editText,
    });

    setEditingId(null);
    setEditText("");
  };

  const handleSubmitReply = (parentId) => {
    if (!replyText.trim()) return;

    onReplyToComment(parentId, {
      text: replyText,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
    });

    setReplyToId(null);
    setReplyText("");
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const startReplying = (commentId) => {
    setReplyToId(commentId);
    setReplyText("");
  };

  const CommentActions = ({ comment }) => (
    <div className="flex items-center space-x-2 text-gray-500">
      <button
        onClick={() => startReplying(comment.id)}
        className="flex items-center hover:text-blue-600"
      >
        <Reply size={14} className="mr-1" />
        Reply
      </button>
      {comment.userId === currentUser.id && (
        <>
          <button
            onClick={() => startEditing(comment)}
            className="flex items-center hover:text-blue-600"
          >
            <Edit2 size={14} className="mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDeleteComment(comment.id)}
            className="flex items-center hover:text-red-600"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </button>
        </>
      )}
    </div>
  );

  const renderComment = (comment, level = 0) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyToId === comment.id;

    return (
      <div
        key={comment.id}
        className={`flex space-x-3 ${level > 0 ? "ml-8 mt-3" : "mt-4"}`}
      >
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            {comment.user?.avatar ||
              comment.user?.name?.[0]?.toUpperCase() ||
              "U"}
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {comment.user?.name || "Unknown User"}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitEdit(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 mt-1">{comment.text}</p>
            )}

            {!isEditing && (
              <div className="mt-2">
                <CommentActions comment={comment} />
              </div>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setReplyToId(null)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reply
                </button>
              </div>
            </div>
          )}

          {/* Render replies */}
          {comment.replies?.map((reply) => renderComment(reply, level + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="relative">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              disabled ? "Comments are disabled" : "Write a comment..."
            }
            className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            disabled={disabled}
          />
          <button
            type="button"
            className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <Smile size={20} />
          </button>
        </div>
        {!disabled && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} className="mr-2" />
              Comment
            </button>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default CommentThread;

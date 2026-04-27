import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { IDEA_MAX_TAGS, WORKSPACE_MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH } from '@/lib/constants';

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/;

function isValidTag(tag) {
  return tag.length >= TAG_MIN_LENGTH && tag.length <= TAG_MAX_LENGTH && TAG_PATTERN.test(tag);
}

export function TagPicker({ value = [], onChange, workspaceTags = [], disabled }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const atIdeaLimit = value.length >= IDEA_MAX_TAGS;
  const atWorkspaceLimit = workspaceTags.length >= WORKSPACE_MAX_TAGS;

  const normalized = input.trim().toLowerCase();

  const suggestions = workspaceTags.filter(
    (t) => !value.includes(t) && normalized !== '' && t.includes(normalized),
  );

  const isExistingTag = workspaceTags.includes(normalized) || value.includes(normalized);
  const canCreate =
    !disabled &&
    !atIdeaLimit &&
    !atWorkspaceLimit &&
    normalized.length >= TAG_MIN_LENGTH &&
    isValidTag(normalized) &&
    !isExistingTag;

  const wsFullBlocksNew =
    !disabled &&
    !atIdeaLimit &&
    atWorkspaceLimit &&
    normalized.length >= TAG_MIN_LENGTH &&
    isValidTag(normalized) &&
    !isExistingTag;

  const select = (tag) => {
    if (disabled || value.includes(tag) || atIdeaLimit) return;
    onChange([...value, tag]);
    setInput('');
    inputRef.current?.focus();
  };

  const remove = (tag) => {
    if (disabled) return;
    onChange(value.filter((t) => t !== tag));
  };

  const create = () => {
    if (!canCreate) return;
    onChange([...value, normalized]);
    setInput('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length === 1) {
        select(suggestions[0]);
      } else if (canCreate) {
        create();
      }
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const showSuggestions = !disabled && !atIdeaLimit && (suggestions.length > 0 || canCreate);

  return (
    <div className="tag-picker">
      {value.length > 0 && (
        <div className="tag-picker-pool">
          {value.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className="tag-chip-remove"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && !atIdeaLimit && (
        <input
          ref={inputRef}
          className="tag-picker-create-input"
          style={{ width: '100%' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={workspaceTags.length === 0 ? 'Type to add a tag…' : 'Search or add tag…'}
          maxLength={TAG_MAX_LENGTH}
          autoComplete="off"
        />
      )}

      {wsFullBlocksNew && (
        <p className="tag-picker-ws-full">
          Workspace full ({WORKSPACE_MAX_TAGS}/{WORKSPACE_MAX_TAGS}) —{' '}
          <Link to="/settings" className="underline">manage in Settings</Link>
        </p>
      )}

      {showSuggestions && (
        <div className="tag-picker-suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-picker-suggestion"
              onClick={() => select(tag)}
            >
              {tag}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className={cn('tag-picker-suggestion', 'is-create')}
              onClick={create}
            >
              + Create &ldquo;{normalized}&rdquo;
            </button>
          )}
        </div>
      )}

      <p className="tag-picker-footer">
        <span className={atIdeaLimit ? 'at-limit' : ''}>{value.length}/{IDEA_MAX_TAGS} per idea</span>
        {' · '}
        <span className={atWorkspaceLimit ? 'at-limit' : ''}>{workspaceTags.length}/{WORKSPACE_MAX_TAGS} workspace</span>
      </p>
    </div>
  );
}

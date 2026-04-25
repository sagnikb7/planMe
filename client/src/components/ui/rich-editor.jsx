import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { cn } from '@/lib/utils';

const TOOLBAR = [
  { label: 'B',  title: 'Bold',           action: (e) => e.chain().focus().toggleBold().run(),           active: (e) => e.isActive('bold') },
  { label: 'I',  title: 'Italic',         action: (e) => e.chain().focus().toggleItalic().run(),         active: (e) => e.isActive('italic') },
  { label: 'S',  title: 'Strikethrough',  action: (e) => e.chain().focus().toggleStrike().run(),         active: (e) => e.isActive('strike') },
  null,
  { label: 'H2', title: 'Heading 2',      action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
  { label: 'H3', title: 'Heading 3',      action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  null,
  { label: '•≡', title: 'Bullet list',    action: (e) => e.chain().focus().toggleBulletList().run(),     active: (e) => e.isActive('bulletList') },
  { label: '1≡', title: 'Ordered list',   action: (e) => e.chain().focus().toggleOrderedList().run(),    active: (e) => e.isActive('orderedList') },
  { label: '☐',  title: 'Task list',      action: (e) => e.chain().focus().toggleTaskList().run(),        active: (e) => e.isActive('taskList') },
  null,
  { label: '"',  title: 'Blockquote',     action: (e) => e.chain().focus().toggleBlockquote().run(),     active: (e) => e.isActive('blockquote') },
  { label: '</>',title: 'Inline code',    action: (e) => e.chain().focus().toggleCode().run(),           active: (e) => e.isActive('code') },
];

export function RichEditor({ content = '', onChange, disabled, placeholder = 'Describe your idea…', className }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: false, HTMLAttributes: { 'data-type': 'taskItem' } }),
    ],
    content,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
  });

  return (
    <div className={cn('rich-editor', className)}>
      <div className="rich-editor-toolbar" aria-label="Formatting toolbar">
        {TOOLBAR.map((item, i) =>
          item === null ? (
            <span key={i} className="rich-editor-toolbar-divider" aria-hidden="true" />
          ) : (
            <button
              key={item.label}
              type="button"
              title={item.title}
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                if (editor) item.action(editor);
              }}
              className={cn(
                'rich-editor-toolbar-btn',
                editor && item.active(editor) && 'is-active'
              )}
            >
              {item.label}
            </button>
          )
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold, Italic, Strikethrough, List, ListOrdered,
    Heading1, Heading2, Heading3, Link as LinkIcon,
    Undo, Redo, Quote
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const activeButtonClass = "bg-purple-200 text-purple-700";
    const inactiveButtonClass = "hover:bg-gray-100 text-gray-600";

    return (
        <div className="flex flex-wrap gap-2 p-3 border-b-2 border-gray-100 bg-gray-50 rounded-t-2xl">
            {/* Bold */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? activeButtonClass : inactiveButtonClass}`}
                title="Bold (Ctrl+B)"
            >
                <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? activeButtonClass : inactiveButtonClass}`}
                title="Italic (Ctrl+I)"
            >
                <Italic className="w-4 h-4" />
            </button>

            {/* Strike */}
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? activeButtonClass : inactiveButtonClass}`}
                title="Strikethrough"
            >
                <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            {/* Headings */}
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? activeButtonClass : inactiveButtonClass}`}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? activeButtonClass : inactiveButtonClass}`}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? activeButtonClass : inactiveButtonClass}`}
                title="Heading 3"
            >
                <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            {/* Lists */}
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? activeButtonClass : inactiveButtonClass}`}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? activeButtonClass : inactiveButtonClass}`}
                title="Ordered List"
            >
                <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            {/* Undo/Redo */}
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                title="Undo (Ctrl+Z)"
            >
                <Undo className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                title="Redo (Ctrl+Y)"
            >
                <Redo className="w-4 h-4" />
            </button>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            // Link.configure({ // Requires @tiptap/extension-link
            //     openOnClick: false,
            // }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[200px] p-4 max-w-none text-gray-800',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update content if value changes externally (e.g. template selection)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Only update if content is different to avoid cursor jumps
            if (editor.getText() === '' && value === '') return; // Simple check
            // For a robust implementation we compare parsed content, but basic check helps
            // Or just trust the consumer to not change value efficiently

            // Actually, for template switching, we DO want to force update
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className={`border-3 border-cyan-300 rounded-2xl bg-white overflow-hidden focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-200 transition-all ${className}`}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} placeholder={placeholder} />
        </div>
    );
};

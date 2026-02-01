'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props {
    content: string;
    onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    // Force re-render to update toolbar state on editor changes
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            forceUpdate(prev => prev + 1);
        };

        editor.on('transaction', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);

        return () => {
            editor.off('transaction', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
        };
    }, [editor]);

    if (!editor) {
        return null;
    }

    const addTable = () => {
        toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Table Size:</span>
                <input 
                    id="table-rows" 
                    type="number" 
                    placeholder="Rows" 
                    defaultValue={3} 
                    min={1} 
                    style={{ width: '50px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
                <span style={{ fontSize: '14px' }}>x</span>
                <input 
                    id="table-cols" 
                    type="number" 
                    placeholder="Cols" 
                    defaultValue={3} 
                    min={1} 
                    style={{ width: '50px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
                <button 
                    onClick={() => {
                        const rInput = document.getElementById('table-rows') as HTMLInputElement;
                        const cInput = document.getElementById('table-cols') as HTMLInputElement;
                        const rows = parseInt(rInput.value || '3');
                        const cols = parseInt(cInput.value || '3');
                        
                        if (rows > 0 && cols > 0) {
                            editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                            toast.dismiss(t.id);
                        } else {
                            toast.error('Invalid dimensions');
                        }
                    }}
                    style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px' 
                    }}
                >
                    Create
                </button>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const deleteTable = () => {
        if (editor.can().chain().focus().deleteTable().run()) {
            editor.chain().focus().deleteTable().run();
        } else {
            toast.error('Place cursor inside a table to delete it');
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '5px', 
            padding: '10px', 
            background: '#f8fafc', 
            borderBottom: '1px solid #cbd5e1',
            alignItems: 'center'
        }}>
            {/* History */}
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="editor-btn"
                title="Undo"
            >
                <i className="fa fa-rotate-left"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="editor-btn"
                title="Redo"
            >
                <i className="fa fa-rotate-right"></i>
            </button>

            <div className="divider"></div>

            {/* Formatting */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`editor-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold"
            >
                <i className="fa fa-bold"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`editor-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic"
            >
                <i className="fa fa-italic"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`editor-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                title="Strike"
            >
                <i className="fa fa-strikethrough"></i>
            </button>

            <div className="divider"></div>

            {/* Alignment */}
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`editor-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                title="Align Left"
            >
                <i className="fa fa-align-left"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`editor-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                title="Align Center"
            >
                <i className="fa fa-align-center"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`editor-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                title="Align Right"
            >
                <i className="fa fa-align-right"></i>
            </button>

            <div className="divider"></div>

            {/* Lists */}
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`editor-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                title="Bullet List"
            >
                <i className="fa fa-list-ul"></i>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`editor-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                title="Ordered List"
            >
                <i className="fa fa-list-ol"></i>
            </button>

            <div className="divider"></div>

            {/* Table */}
            <button
                onClick={addTable}
                className="editor-btn"
                title="Insert Table"
            >
                <i className="fa fa-table"></i>
            </button>
            <button
                onClick={deleteTable}
                className="editor-btn"
                title="Delete Table"
                style={{ opacity: editor.can().chain().focus().deleteTable().run() ? 1 : 0.5 }}
            >
                <i className="fa fa-trash-can"></i>
            </button>
             <button
                onClick={() => {
                    if (editor.can().chain().focus().addColumnAfter().run()) {
                        editor.chain().focus().addColumnAfter().run();
                    } else {
                        toast.error('Place cursor inside a table to add a column');
                    }
                }}
                className="editor-btn"
                title="Add Column"
                style={{ opacity: editor.can().chain().focus().addColumnAfter().run() ? 1 : 0.5 }}
            >
                <i className="fa fa-table-columns"></i>+
            </button>
             <button
                onClick={() => {
                   if (editor.can().chain().focus().addRowAfter().run()) {
                        editor.chain().focus().addRowAfter().run();
                    } else {
                        toast.error('Place cursor inside a table to add a row');
                    }
                }}
                className="editor-btn"
                title="Add Row"
                style={{ opacity: editor.can().chain().focus().addRowAfter().run() ? 1 : 0.5 }}
            >
                <i className="fa fa-table-cells"></i>+
            </button>
        </div>
    )
}

export default function RichTextEditor({ content, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false, // Fix SSR hydration mismatch
    });

    return (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <MenuBar editor={editor} />
            <div style={{ padding: '15px', minHeight: '300px' }}>
                <EditorContent editor={editor} />
            </div>
            
            <style jsx global>{`
                .ProseMirror {
                    min-height: 300px;
                    outline: none;
                }
                .ProseMirror p {
                    margin-top: 0;
                    margin-bottom: 0.5em;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.5em;
                }
                .editor-btn {
                    padding: 6px 10px;
                    background: white;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #475569;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    opacity: 0.6; /* Default opacity for unselected */
                    transition: all 0.2s;
                }
                .editor-btn:hover {
                    background: #f1f5f9;
                    opacity: 1;
                }
                .editor-btn.is-active {
                    background: #e0f2fe;
                    color: #0369a1;
                    border-color: #7dd3fc;
                    opacity: 1; /* Full opacity when selected */
                }
                .editor-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .divider {
                    width: 1px;
                    height: 24px;
                    background: #cbd5e1;
                    margin: 0 5px;
                }

                /* Table Styles */
                .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }
                .ProseMirror td,
                .ProseMirror th {
                    min-width: 1em;
                    border: 2px solid #ced4da;
                    padding: 3px 5px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }
                .ProseMirror th {
                    font-weight: bold;
                    text-align: left;
                    background-color: #f1f3f5;
                }
                .ProseMirror .selectedCell:after {
                    z-index: 2;
                    position: absolute;
                    content: "";
                    left: 0; right: 0; top: 0; bottom: 0;
                    background: rgba(200, 200, 255, 0.4);
                    pointer-events: none;
                }
                .ProseMirror .column-resize-handle {
                    position: absolute;
                    right: -2px;
                    top: 0;
                    bottom: -2px;
                    width: 4px;
                    background-color: #adf;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}

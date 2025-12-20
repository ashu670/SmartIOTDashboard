import React, { useState } from 'react';

const RoomItem = ({ room, isSelected, onClick, isAdmin, onDeleteRoom }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsConfirming(true);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        onDeleteRoom(room._id);
        setIsConfirming(false);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setIsConfirming(false);
    };

    // 1. CONFIRMATION STATE (Replaces content)
    if (isConfirming) {
        return (
            <div className="w-full sm:w-auto animate-in fade-in duration-200">
                <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-500/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider text-center">
                        Are you sure?
                    </span>
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleCancelDelete}
                            className="flex-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="flex-1 px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. NORMAL ROOM CARD
    return (
        <div className="w-full sm:w-auto">
            <div
                onClick={onClick}
                className={`room-item ${isSelected ? 'active' : ''}`}
            >
                <span className="truncate mr-2 font-medium">{room.name}</span>

                {/* Delete Icon (Visible on Hover/Selected) */}
                {isAdmin && (
                    <button
                        onClick={handleDeleteClick}
                        className="room-delete w-6 h-6 rounded flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        title="Remove Room"
                    >
                        {/* Simple Trash Outline Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default RoomItem;

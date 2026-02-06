import React, { useState } from 'react';
import { X, User, ChevronDown, Check, Ban, Trash2 } from 'lucide-react';
import './PermissionModal.css';

import { getNoteMembersApi } from '../../../api/notes/GetNoteMembers.api';
import { updateMemberRoleApi } from '../../../api/notes/UpdateMemberRole.api';
import { deleteMemberApi } from '../../../api/notes/DeleteMember.api';
import { getPendingInvitationsApi, approveInvitationApi, PendingInvitationItem } from '../../../api/notes/Invitation.api';
import { NoteMemberItem, NoteMemberRole } from '../../../types/note/GetNoteMembers';
import ConfirmModal from './ConfirmModal';
import { ToastNotification } from '../toast/ToastNotification';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId?: string;
    currentUserRole?: NoteMemberRole; // [New]
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, noteId, currentUserRole }) => {
    const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS'>('MEMBERS');
    const [members, setMembers] = useState<NoteMemberItem[]>([]);
    const [requests, setRequests] = useState<PendingInvitationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // [New] UI State for Modals and Toasts
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; targetId: string | null }>({
        isOpen: false,
        message: '',
        targetId: null,
    });
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({
        isVisible: false,
        message: '',
        type: 'success',
    });

    React.useEffect(() => {
        if (isOpen && noteId) {
            fetchData();
        }
    }, [isOpen, noteId, activeTab]);

    const fetchData = async () => {
        if (!noteId) return;
        setIsLoading(true);
        try {
            if (activeTab === 'MEMBERS') {
                const res = await getNoteMembersApi(noteId);
                if (res && res.members) {
                    setMembers(res.members);
                }
            } else {
                // If not owner, maybe don't fetch requests? 
                // But let's fetch for now if they somehow got here, or just let it be.
                const res = await getPendingInvitationsApi(noteId);
                if (res && res.invitations) {
                    // Filter only REQUESTED status for this tab
                    const requestedInvites = res.invitations.filter(inv => inv.status === 'REQUESTED');
                    setRequests(requestedInvites);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // [Refactor] 초기 로딩 시 모든 데이터 한 번 로드 (UI 숫자 표기용)
    const initialFetch = async () => {
        if (!noteId) return;
        try {
            const [membersRes, invitesRes] = await Promise.all([
                getNoteMembersApi(noteId),
                getPendingInvitationsApi(noteId)
            ]);

            if (membersRes?.members) setMembers(membersRes.members);
            if (invitesRes?.invitations) {
                setRequests(invitesRes.invitations.filter(inv => inv.status === 'REQUESTED'));
            }
        } catch (e) {
            console.error("Failed to initial fetch:", e);
        }
    };

    React.useEffect(() => {
        if (isOpen && noteId) {
            initialFetch();
        }
    }, [isOpen, noteId]);


    if (!isOpen) return null;

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ isVisible: true, message, type });
    };

    const handleRoleChange = async (memberId: string, newRole: NoteMemberRole) => {
        if (!noteId) return;

        // Optimistic update
        const previousMembers = [...members];
        setMembers(members.map(m =>
            m.memberId === memberId ? { ...m, role: newRole } : m
        ));

        try {
            await updateMemberRoleApi(noteId, memberId, newRole);
            console.log(`Updated role for ${memberId} to ${newRole}`);
            showToast("권한이 변경되었습니다.", 'success');
        } catch (error) {
            console.error("Failed to update role:", error);
            // Revert on error
            setMembers(previousMembers);
            showToast("권한 변경에 실패했습니다.", 'error');
        }
    };

    const confirmRemoveMember = (memberId: string) => {
        setConfirmModal({
            isOpen: true,
            message: "정말로 이 멤버를 내보내시겠습니까?",
            targetId: memberId,
        });
    };

    const executeRemoveMember = async () => {
        const memberId = confirmModal.targetId;
        if (!noteId || !memberId) return;

        setConfirmModal({ ...confirmModal, isOpen: false }); // Close modal

        const previousMembers = [...members];
        setMembers(members.filter(m => m.memberId !== memberId));

        try {
            await deleteMemberApi(noteId, memberId);
            showToast("멤버를 내보냈습니다.", 'success');
        } catch (error) {
            console.error("Failed to remove member:", error);
            setMembers(previousMembers);
            showToast("멤버 내보내기에 실패했습니다.", 'error');
        }
    };

    const handleAcceptRequest = async (invitationId: string, role: NoteMemberRole, memberId?: string) => {
        try {
            // 1. 수락 요청 (API가 role을 무시할 수 있음)
            await approveInvitationApi(invitationId, role as 'EDITOR' | 'VIEWER');

            // 2. 수락 후 권한 업데이트 (확실하게 적용)
            if (memberId && noteId) {
                // 약간의 딜레이를 주어 DB 반영 시간 확보 (필요 시)
                await updateMemberRoleApi(noteId, memberId, role);
            }

            showToast("요청을 수락했습니다.", 'success');
            // Refresh list
            setRequests(requests.filter(r => r.id !== invitationId));

            // 멤버 목록 갱신
            const membersRes = await getNoteMembersApi(noteId!);
            if (membersRes?.members) setMembers(membersRes.members);

        } catch (error) {
            console.error(error);
            showToast("요청 수락에 실패했습니다.", 'error');
        }
    };

    return (
        <div className="permission-modal-overlay" onClick={onClose}>
            <div className="permission-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="permission-modal-header">
                    <h3>멤버 권한 관리</h3>
                    <button className="permission-modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="permission-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'MEMBERS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('MEMBERS')}
                    >
                        멤버 목록 ({members.length})
                    </button>
                    {/* [Modified] Show requests tab ONLY if owner */}
                    {currentUserRole === 'OWNER' && (
                        <button
                            className={`tab-btn ${activeTab === 'REQUESTS' ? 'active' : ''}`}
                            onClick={() => setActiveTab('REQUESTS')}
                        >
                            가입 신청 ({requests.length})
                        </button>
                    )}
                </div>

                <div className="permission-modal-body">
                    {activeTab === 'MEMBERS' ? (
                        <>
                            <p className="permission-modal-description">
                                이 노트에 접근 가능한 멤버들의 권한을 설정합니다.
                            </p>

                            <div className="members-list">
                                {isLoading ? (
                                    <div className="loading-state">로딩 중...</div>
                                ) : members.length === 0 ? (
                                    <div className="empty-state">멤버가 없습니다.</div>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.memberId} className="member-item">
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    <User size={20} />
                                                </div>
                                                <div className="member-details">
                                                    <span className="member-nickname">{member.name}</span>
                                                    <span className="member-email">{member.email}</span>
                                                </div>
                                            </div>

                                            <div className="member-role-action">
                                                {member.role === 'OWNER' ? (
                                                    <span className="role-badge owner">소유자</span>
                                                ) : (
                                                    <div className="role-select-wrapper">
                                                        <select
                                                            className="role-select"
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.memberId, e.target.value as NoteMemberRole)}
                                                        >
                                                            <option value="EDITOR">편집자</option>
                                                            <option value="VIEWER">뷰어</option>
                                                        </select>
                                                        <ChevronDown size={14} className="role-select-icon" />
                                                    </div>
                                                )}
                                                {member.role !== 'OWNER' && (
                                                    <button
                                                        className="member-remove-btn"
                                                        onClick={() => confirmRemoveMember(member.memberId)}
                                                        title="멤버 내보내기"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="permission-modal-description">
                                노트 접근 권한을 요청한 사용자들입니다.
                            </p>

                            <div className="requests-list">
                                {requests.length === 0 ? (
                                    <div className="empty-state">대기 중인 요청이 없습니다.</div>
                                ) : (
                                    requests.map((req) => (
                                        <div key={req.id} className="request-item">
                                            <div className="member-info">
                                                <div className="member-avatar request">
                                                    <User size={20} />
                                                </div>
                                                <div className="member-details">
                                                    <span className="member-nickname">{req.invitedMember?.name || 'Unknown'}</span>
                                                    <span className="member-email">{req.invitedMember?.email || req.invitedEmail}</span>
                                                </div>
                                            </div>

                                            <div className="request-actions">
                                                <div className="role-select-wrapper">
                                                    <select
                                                        className="role-select"
                                                        value={req.role}
                                                        onChange={(e) => {
                                                            const newRole = e.target.value as 'EDITOR' | 'VIEWER';
                                                            setRequests(prev => prev.map(r =>
                                                                r.id === req.id ? { ...r, role: newRole } : r
                                                            ));
                                                        }}
                                                    >
                                                        <option value="EDITOR">편집자</option>
                                                        <option value="VIEWER">뷰어</option>
                                                    </select>
                                                    <ChevronDown size={14} className="role-select-icon" />
                                                </div>

                                                <button
                                                    className="action-btn accept"
                                                    onClick={() => handleAcceptRequest(req.id, req.role, req.invitedMember?.id)}
                                                    title="수락"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                {/* Reject is not implemented yet in this iteration */}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Confirm Modal */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    message={confirmModal.message}
                    onConfirm={executeRemoveMember}
                    onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                />

                {/* Toast Notification */}
                <ToastNotification
                    isVisible={toast.isVisible}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, isVisible: false })}
                />
            </div>
        </div>
    );
};

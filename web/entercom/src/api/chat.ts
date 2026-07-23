import { apiClient as axiosInstance } from './axios';

export interface ChatAttachment {
  id: string;
  file: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface ChatMessage {
  id: string;
  conversation: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  body: string;
  message_type: 'text' | 'system' | 'internal_note';
  created_at: string;
  edited_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  is_deleted: boolean;
  attachments?: ChatAttachment[];
}

export interface ChatParticipant {
  id: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  joined_at: string;
  last_read_at: string;
  is_active: boolean;
}

export interface ChatConversation {
  id: string;
  public_id: string;
  subject: string;
  status: 'open' | 'resolved' | 'closed';
  conversation_type: 'support' | 'request' | 'booking' | 'payment';
  request: string | null;
  booking: string | null;
  payment: string | null;
  created_by: any;
  assigned_staff: any;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  unread_count: number;
  last_message: ChatMessage | null;
  participants?: ChatParticipant[]; // Only present in detail view
}

export const chatApi = {
  list: async (): Promise<ChatConversation[]> => {
    const { data } = await axiosInstance.get('/chat/conversations/');
    return data;
  },

  search: async (query: string): Promise<ChatConversation[]> => {
    const { data } = await axiosInstance.get(`/chat/conversations/search/?q=${encodeURIComponent(query)}`);
    return data.results || data;
  },

  get: async (id: string): Promise<ChatConversation> => {
    const { data } = await axiosInstance.get(`/chat/conversations/${id}/`);
    return data;
  },

  create: async (payload: {
    subject: string;
    conversation_type: string;
    request?: string;
    booking?: string;
    payment?: string;
  }): Promise<ChatConversation> => {
    const { data } = await axiosInstance.post('/chat/conversations/', payload);
    return data;
  },

  getMessages: async (id: string, page = 1): Promise<{ results: ChatMessage[]; next: string | null }> => {
    const { data } = await axiosInstance.get(`/chat/conversations/${id}/messages/?page=${page}`);
    // Handle both paginated and non-paginated responses for safety
    if (data.results) {
        return data;
    }
    return { results: data, next: null };
  },

  sendMessage: async (id: string, body: string, messageType: 'text' | 'internal_note' = 'text', files: File[] = []): Promise<ChatMessage> => {
    if (files.length > 0) {
      const formData = new FormData();
      formData.append('body', body);
      formData.append('message_type', messageType);
      files.forEach(f => formData.append('attachments', f));
      
      const { data } = await axiosInstance.post(`/chat/conversations/${id}/messages/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return data;
    } else {
      const { data } = await axiosInstance.post(`/chat/conversations/${id}/messages/`, { body, message_type: messageType });
      return data;
    }
  },

  markRead: async (id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/read/`);
  },

  assignStaff: async (id: string, staff_id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/assign/`, { staff_id });
  },

  transfer: async (id: string, staff_id: string, reason: string = ''): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/transfer/`, { staff_id, reason });
  },

  resolve: async (id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/resolve/`);
  },
};

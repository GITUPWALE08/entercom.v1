import axiosInstance from './axiosConfig';

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
  message_type: 'text' | 'system';
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
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

  sendMessage: async (id: string, body: string): Promise<ChatMessage> => {
    const { data } = await axiosInstance.post(`/chat/conversations/${id}/messages/`, { body });
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/read/`);
  },

  assignStaff: async (id: string, staff_id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/assign/`, { staff_id });
  },

  resolve: async (id: string): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${id}/resolve/`);
  },
};

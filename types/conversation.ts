// Conversation Types

interface Message {
  sender: 'student' | 'patient' | 'parent' | 'system';
  text: string;
  timestamp: string;
  speakerLabel?: string; // For pediatric cases: "Mother", "Father", "Child"
}

interface PatientResponse {
  messages: {
    response: string;
    sender: 'patient' | 'parent';
    speakerLabel: string;
  }[];
}

export type {
  Message,
  PatientResponse
};

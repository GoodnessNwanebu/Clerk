export interface ShareData {
  diagnosis: string;
  correctDiagnosis: string;
  department: string;
  achievementText: string;
  shareMessage: string;
}

export interface ShareCardProps {
  shareData: ShareData;
  className?: string;
}

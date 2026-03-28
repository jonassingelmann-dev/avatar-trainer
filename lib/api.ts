import { trpc } from "./trpc";

export { trpc };

// Re-export common query/mutation hooks for convenience
export const useSessionsList = () => trpc.sessions.list.useQuery();
export const useSessionByCode = (code: string) => trpc.sessions.getByCode.useQuery({ code }, { enabled: !!code });
export const useCreateSession = () => trpc.sessions.create.useMutation();
export const useUpdateSession = () => trpc.sessions.update.useMutation();
export const useDeleteSession = () => trpc.sessions.delete.useMutation();

export const useDocumentsList = (sessionId: number) =>
  trpc.documents.list.useQuery({ sessionId }, { enabled: !!sessionId });
export const useUploadDocument = () => trpc.documents.upload.useMutation();
export const useDeleteDocument = () => trpc.documents.delete.useMutation();

export const useListAvatars = () => trpc.heygen.listAvatars.useQuery();
export const useListVoices = () => trpc.heygen.listVoices.useQuery();
export const useCreateSessionToken = () => trpc.heygen.createSessionToken.useMutation();
export const useStartSession = () => trpc.heygen.startSession.useMutation();
export const useStopSession = () => trpc.heygen.stopSession.useMutation();
export const useBuildContext = () => trpc.heygen.buildContext.useMutation();

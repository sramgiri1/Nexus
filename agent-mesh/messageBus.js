export {
  appendMeshMessage,
  ensureMeshMessageStore,
  getMeshMessage,
  listMeshMessages,
  listMessagesForAgent,
  listMessagesForRoom,
  listMessagesForTask,
} from "./messageStore.js";

export function summarizeMeshMessages(messages = []) {
  const byType = {};
  const byRoom = {};
  for (const message of messages) {
    byType[message.messageType] = (byType[message.messageType] || 0) + 1;
    byRoom[message.roomId] = (byRoom[message.roomId] || 0) + 1;
  }
  return {
    total: messages.length,
    byType,
    byRoom,
    redacted: messages.every((message) => message.redacted === true),
    rawPayloadStored: messages.some((message) => message.rawPayloadStored !== false),
  };
}

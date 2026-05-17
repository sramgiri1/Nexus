import { isCareReceiverActive } from "./receiver-state.js";

export function isActiveRecipientAccess(accessGrant) {
  return Boolean(accessGrant) && !accessGrant.revokedAt;
}

export function isCareOrganizer(member) {
  return member?.role === "ADMIN";
}

export function isCareReceiver(member) {
  return member?.role === "RECIPIENT";
}

export function canViewReceiver({ member, userId, receiver, accessGrant }) {
  if (!member || !receiver) return false;
  if (isCareOrganizer(member)) return member.circleId === receiver.circleId;
  if (isCareReceiver(member)) return receiver.receiverUserId === userId;
  return member.circleId === receiver.circleId && isActiveRecipientAccess(accessGrant);
}

export function canCreateTaskForReceiver({ member, receiver, accessGrant }) {
  if (!member || !receiver || !isCareReceiverActive(receiver)) return false;
  if (isCareOrganizer(member)) return member.circleId === receiver.circleId;
  if (isCareReceiver(member)) return false;
  return member.circleId === receiver.circleId && isActiveRecipientAccess(accessGrant);
}

export function canViewTask({ member, userId, task, receiver, accessGrant }) {
  if (!member || !task || !receiver) return false;
  if (isCareOrganizer(member)) return member.circleId === task.circleId;
  if (isCareReceiver(member)) {
    return receiver.receiverUserId === userId && task.assigneeId === userId;
  }
  if (!isActiveRecipientAccess(accessGrant)) return false;
  if (task.assigneeId === userId) return true;
  return task.assigneeId === receiver.receiverUserId;
}

export function canEditTask({ member, userId, task }) {
  if (!member || !task) return false;
  if (isCareOrganizer(member)) return member.circleId === task.circleId;
  if (isCareReceiver(member)) return false;
  return task.creatorId === userId;
}

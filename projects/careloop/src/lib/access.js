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

const recipientOrder = [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }];

export async function loadReceiverAccessContext(db, { circleId, member, userId }) {
  const recipients = await db.careRecipient.findMany({
    where: { circleId },
    orderBy: recipientOrder,
  });

  if (isCareOrganizer(member)) {
    return {
      recipients,
      recipientIds: new Set(recipients.map((recipient) => recipient.id)),
      accessGrantByRecipientId: new Map(),
    };
  }

  if (isCareReceiver(member)) {
    const visibleRecipients = recipients.filter((recipient) => recipient.receiverUserId === userId);
    return {
      recipients: visibleRecipients,
      recipientIds: new Set(visibleRecipients.map((recipient) => recipient.id)),
      accessGrantByRecipientId: new Map(),
    };
  }

  const accessGrants = await db.careRecipientAccess.findMany({
    where: { memberId: member.id, revokedAt: null },
  });
  const accessGrantByRecipientId = new Map(
    accessGrants.map((grant) => [grant.recipientId, grant]),
  );
  const visibleRecipients = recipients.filter((recipient) => accessGrantByRecipientId.has(recipient.id));

  return {
    recipients: visibleRecipients,
    recipientIds: new Set(visibleRecipients.map((recipient) => recipient.id)),
    accessGrantByRecipientId,
  };
}

export function canAccessReceiverById(accessContext, recipientId) {
  if (!recipientId) return false;
  return accessContext.recipientIds.has(recipientId);
}

export function filterVisibleTasks(tasks, { member, userId, accessContext }) {
  const recipientById = new Map(accessContext.recipients.map((recipient) => [recipient.id, recipient]));
  return tasks.filter((task) => {
    const receiver = recipientById.get(task.recipientId);
    if (!receiver) return false;
    return canViewTask({
      member,
      userId,
      task,
      receiver,
      accessGrant: accessContext.accessGrantByRecipientId.get(task.recipientId) ?? null,
    });
  });
}

export function canCreateTaskWithAccess({ member, receiver, accessContext }) {
  return canCreateTaskForReceiver({
    member,
    receiver,
    accessGrant: accessContext.accessGrantByRecipientId.get(receiver.id) ?? null,
  });
}

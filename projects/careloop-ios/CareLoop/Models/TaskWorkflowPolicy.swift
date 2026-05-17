import Foundation

enum TaskWorkflowPolicy {
    static func activeRecipients(_ recipients: [CareRecipient]) -> [CareRecipient] {
        recipients.filter(\.isActiveForTasks)
    }

    static func eligibleAssigneeMembers(
        for recipient: CareRecipient?,
        members: [CircleMember],
        isOrganizer: Bool,
        currentUserId: String
    ) -> [CircleMember] {
        let allowedIds: Set<String>
        if isOrganizer {
            allowedIds = Set(members.map(\.userId))
        } else {
            allowedIds = Set(recipient?.eligibleAssigneeIds ?? [currentUserId])
        }

        return members
            .filter { allowedIds.contains($0.userId) }
            .sorted { lhs, rhs in
                let leftRank = assigneeSortRank(member: lhs, recipient: recipient, currentUserId: currentUserId)
                let rightRank = assigneeSortRank(member: rhs, recipient: recipient, currentUserId: currentUserId)
                if leftRank != rightRank { return leftRank < rightRank }
                let leftName = lhs.user?.name ?? lhs.userId
                let rightName = rhs.user?.name ?? rhs.userId
                return leftName.localizedCaseInsensitiveCompare(rightName) == .orderedAscending
            }
    }

    static func defaultAssigneeId(
        for recipient: CareRecipient?,
        members: [CircleMember],
        isOrganizer: Bool,
        currentUserId: String
    ) -> String? {
        let eligible = eligibleAssigneeMembers(
            for: recipient,
            members: members,
            isOrganizer: isOrganizer,
            currentUserId: currentUserId
        )
        if eligible.contains(where: { $0.userId == currentUserId }) {
            return currentUserId
        }
        if let receiverUserId = recipient?.receiverUserId,
           eligible.contains(where: { $0.userId == receiverUserId }) {
            return receiverUserId
        }
        return eligible.first?.userId
    }

    static func canToggleFromList(_ task: CareTask) -> Bool {
        if task.status == .done || task.status == .skipped {
            return task.capabilities?.canChangeStatus ?? false
        }
        return task.capabilities?.canMarkDone ?? false
    }

    private static func assigneeSortRank(
        member: CircleMember,
        recipient: CareRecipient?,
        currentUserId: String
    ) -> Int {
        if member.userId == currentUserId { return 0 }
        if member.userId == recipient?.receiverUserId { return 1 }
        if member.role == .admin { return 2 }
        return 3
    }
}

import type {
  CommandCapability,
  CommandPriorityItem,
  CommandRecommendation
} from "./commandCentreTypes.js";

type PriorityCapability = {
  status:
    CommandCapability<unknown>[
      "status"
    ];
  data: {
    priorityItems:
      CommandPriorityItem[];
  } | null;
};

function comparePriorityItems(
  left: CommandPriorityItem,
  right: CommandPriorityItem
) {
  if (
    left.severityRank !==
    right.severityRank
  ) {
    return (
      right.severityRank -
      left.severityRank
    );
  }

  if (
    left.breached !==
    right.breached
  ) {
    return left.breached
      ? -1
      : 1;
  }

  if (
    left.overdue !==
    right.overdue
  ) {
    return left.overdue
      ? -1
      : 1;
  }

  if (
    left.blocked !==
    right.blocked
  ) {
    return left.blocked
      ? -1
      : 1;
  }

  const leftDue =
    left.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  const rightDue =
    right.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  if (
    leftDue !==
    rightDue
  ) {
    return (
      leftDue -
      rightDue
    );
  }

  const timestampDifference =
    right.sourceTimestamp.getTime() -
    left.sourceTimestamp.getTime();

  if (
    timestampDifference !== 0
  ) {
    return timestampDifference;
  }

  const capabilityDifference =
    left.sourceCapability
      .localeCompare(
        right.sourceCapability
      );

  if (
    capabilityDifference !== 0
  ) {
    return capabilityDifference;
  }

  const typeDifference =
    left.sourceType
      .localeCompare(
        right.sourceType
      );

  if (
    typeDifference !== 0
  ) {
    return typeDifference;
  }

  return left.sourceId
    .localeCompare(
      right.sourceId
    );
}

export function composeCommandCentrePriorities(
  capabilities:
    PriorityCapability[],
  input?: {
    limit?: number;
  }
) {
  const limit =
    Math.min(
      Math.max(
        input?.limit ?? 10,
        1
      ),
      25
    );

  return capabilities
    .filter(
      (capability) =>
        capability.status ===
          "AVAILABLE" &&
        capability.data !==
          null
    )
    .flatMap(
      (capability) =>
        capability.data
          ?.priorityItems ??
        []
    )
    .sort(
      comparePriorityItems
    )
    .slice(
      0,
      limit
    );
}

function recommendationKey(
  recommendation:
    CommandRecommendation
) {
  return recommendation.text
    .trim()
    .toLocaleLowerCase();
}

export function composeCommandCentreRecommendations(
  groups:
    CommandRecommendation[][],
  input?: {
    limit?: number;
  }
) {
  const limit =
    Math.min(
      Math.max(
        input?.limit ?? 10,
        1
      ),
      25
    );

  const recommendations =
    new Map<
      string,
      CommandRecommendation
    >();

  for (
    const recommendation
    of groups.flat()
  ) {
    const key =
      recommendationKey(
        recommendation
      );

    const existing =
      recommendations.get(
        key
      );

    if (!existing) {
      recommendations.set(
        key,
        {
          text:
            recommendation.text,
          sources: [
            ...recommendation.sources
          ].sort(
            (
              left,
              right
            ) => {
              const capability =
                left.capability
                  .localeCompare(
                    right.capability
                  );

              if (
                capability !== 0
              ) {
                return capability;
              }

              const sourceType =
                left.sourceType
                  .localeCompare(
                    right.sourceType
                  );

              if (
                sourceType !== 0
              ) {
                return sourceType;
              }

              return left.sourceId
                .localeCompare(
                  right.sourceId
                );
            }
          )
        }
      );

      continue;
    }

    const sourceKeys =
      new Set(
        existing.sources.map(
          (source) =>
            [
              source.capability,
              source.sourceType,
              source.sourceId
            ].join(":")
        )
      );

    for (
      const source
      of recommendation.sources
    ) {
      const sourceIdentity =
        [
          source.capability,
          source.sourceType,
          source.sourceId
        ].join(":");

      if (
        !sourceKeys.has(
          sourceIdentity
        )
      ) {
        existing.sources.push(
          source
        );

        sourceKeys.add(
          sourceIdentity
        );
      }
    }

    existing.sources.sort(
      (
        left,
        right
      ) => {
        const capability =
          left.capability
            .localeCompare(
              right.capability
            );

        if (
          capability !== 0
        ) {
          return capability;
        }

        const sourceType =
          left.sourceType
            .localeCompare(
              right.sourceType
            );

        if (
          sourceType !== 0
        ) {
          return sourceType;
        }

        return left.sourceId
          .localeCompare(
            right.sourceId
          );
      }
    );
  }

  return Array.from(
    recommendations.values()
  )
    .sort(
      (left, right) =>
        recommendationKey(
          left
        ).localeCompare(
          recommendationKey(
            right
          )
        )
    )
    .slice(
      0,
      limit
    );
}

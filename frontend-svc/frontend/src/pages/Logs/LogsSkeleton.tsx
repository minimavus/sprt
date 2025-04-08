import { FC } from "react";

import { ColumnHeading, Columns, Left, Right } from "@/components/Columns";
import { SkeletonLines } from "@/components/Skeleton";

export const LogsSkeleton: FC = () => {
  return (
    <Columns>
      <Left>
        <ColumnHeading>Users</ColumnHeading>
        <SkeletonLines mb={0} x={6} />
      </Left>
      <Right>
        <SkeletonLines mb={0} x={6} lastIsShort />
      </Right>
    </Columns>
  );
};

import {
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  Server,
  Users,
  Clock
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Deployments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            2,547
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex gap-1 items-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +15.3%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Rocket className="size-4" /> 145 deployments this week
          </div>
          <div className="text-muted-foreground">
            Up from 126 last week
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            78
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex gap-1 items-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Server className="size-4" /> 12 new projects this month
          </div>
          <div className="text-muted-foreground">
            Across 4 environments
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,254
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex gap-1 items-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +5.7%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Users className="size-4" /> 68 active users today
          </div>
          <div className="text-muted-foreground">
            87% retention rate
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            94.3%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex gap-1 items-center">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              -1.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Clock className="size-4" /> Avg. deploy time: 4m 12s
          </div>
          <div className="text-muted-foreground">
            24 failed deployments this month
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

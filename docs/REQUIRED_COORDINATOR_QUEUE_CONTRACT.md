# Required coordinator queue contract

The coordinator queue is an all-reports workspace. It must include unclaimed
and claimed reports rather than removing a report after it is claimed.

## Required endpoint behaviour

`GET /api/v1/coordinator/queue?page=1&pageSize=20`

- Return every submitted report the coordinator role is allowed to see.
- Do not filter the result to `owner_id IS NULL`.
- Keep pagination stable and return the total across claimed and unclaimed
  records.
- Return the current status and owner so the frontend can show the correct
  action.
- Do not include protected evidence or precise coordinates in this list.

## Required item shape

```json
{
  "reportReference": "RC-0241",
  "threat": "Ghost fishing gear",
  "area": "Example reef site",
  "statusCode": "claimed",
  "statusLabel": "Claimed",
  "submittedAt": "2026-09-04T01:00:00Z",
  "hoursInQueue": null,
  "owner": {
    "id": 12,
    "displayName": "Sample Coordinator"
  },
  "claimedAt": "2026-09-04T02:00:00Z"
}
```

For an unclaimed report, `owner` and `claimedAt` should be `null`, and
`hoursInQueue` should contain the current waiting time.

## Frontend behaviour

- Unclaimed reports show **Review and claim**.
- Reports owned by the signed-in coordinator show **View claimed case**.
- Reports owned by another coordinator show the owner and no claim action.
- Ownership filters allow All reports, Unclaimed, Claimed and Claimed by me.

The frontend already supports this response. Until the backend returns these
fields for all reports, it displays a warning explaining why claimed reports
are missing.

## Related backend gap

After `POST /api/v1/coordinator/reports/{reportReference}/claim`, the documented
status is `claimed`. The decision endpoint accepts only `under_review`,
`evidence_accepted`, `monitoring` or `referred`, but no endpoint is documented
for moving a claimed case into review. The backend must either:

1. make claiming transition the case directly to `under_review`; or
2. add an owned-case endpoint that explicitly starts review.

The choice should be documented and tested before the coordinator decision
workflow is considered complete.

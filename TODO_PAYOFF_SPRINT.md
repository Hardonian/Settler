# Settler TODO Payoff Sprint
## Target: Reduce 115 TODOs to 50 in 2 weeks

**Started**: 2026-04-09  
**Goal**: Resolve highest-impact TODOs first

---

## TODO Categories (by impact)

### 🔴 Critical - Blocking Features (12 TODOs)
1. **Edge Node Hardware Detection** (4 TODOs)
   - `EdgeNodeService.ts`: GPU detection, NPU detection, ONNX runtime check
   - Impact: Reality system accuracy
   
2. **Reality System Heartbeats** (1 TODO)
   - `EdgeNodeService.ts`: Track actual last heartbeat
   - Impact: Node health monitoring
   
3. **Alerting/Notifications** (7 TODOs)
   - `alert-manager.ts`: PagerDuty, Slack integration
   - Impact: Operations team needs alerts

### 🟡 High - Performance/Reliability (23 TODOs)
4. **Database/Query Layer** (6 TODOs)
   - Timeout handling, query builder, analytics
   - Impact: Production stability
   
5. **Token Refresh** (5 TODOs)
   - Xero, Amazon adapters
   - Impact: Integration reliability
   
6. **AI/ML Infrastructure** (12 TODOs)
   - Anomaly detection, infrastructure optimizer
   - Impact: AI features not production-ready

### 🟢 Medium - UX/Nice to Have (15 TODOs)
7. **Chat/File Upload** (5 TODOs)
   - File uploads, image sharing
   - Impact: Support experience
   
8. **Referrals** (3 TODOs)
   - Reward system incomplete
   - Impact: Growth feature
   
9. **Caching/Performance** (7 TODOs)
   - API caching, flags resolver
   - Impact: Performance optimization

### 🟣 Low - Polish (65 TODOs)
10. **Various small improvements**
    - Logging, error messages, edge cases

---

## Execution Order

### Week 1: Critical + High Priority
**Day 1-2**: Edge Node Hardware Detection
**Day 3-4**: Reality System Heartbeats
**Day 5-7**: Alerting/Notifications MVP

### Week 2: High + Medium Priority  
**Day 8-10**: Database timeout handling
**Day 11-12**: Token refresh automation
**Day 13-14**: Chat file upload

---

## Progress Tracking

| Date | TODOs Resolved | Running Total | Focus Area |
|------|---------------|---------------|------------|
| 2026-04-09 | 0 | 115 | Sprint start |
| 2026-04-09 | 5 | 110 | EdgeNode hardware detection, heartbeats |
| 2026-04-09 | 5 | 105 | Notification service (Email, Slack, PagerDuty) |


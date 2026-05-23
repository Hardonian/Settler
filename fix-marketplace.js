const fs = require("fs");
const filePath = "packages/api/src/services/economic/marketplace-intelligence.ts";

let code = fs.readFileSync(filePath, "utf8");

const search = `    const items: MarketplaceItem[] = [];

    for (const template of templates) {
      const jobs = await this.prisma.reconJob.findMany({
        where: { templateId: template.id },
        take: 1000,
      });

      const popularity = Math.min(jobs.length / 1000, 1.0);

      const drifts = await this.prisma.driftEvent.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
        },
        take: 100,
      });

      const driftRate = drifts.length / Math.max(jobs.length, 1);

      const results = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
        },
        take: 1000,
      });

      const failures = results.filter((r: { status: string }) => r.status === "failed").length;
      const reliability = 1 - failures / Math.max(results.length, 1);

      const revenuePotential = popularity * reliability * 1000; // Placeholder

      items.push({
        id: template.id,
        type: "template",
        name: template.name,
        popularity,
        driftRate,
        reliability,
        revenuePotential,
      });
    }`;

const replace = `    const items: MarketplaceItem[] = [];

    const CHUNK_SIZE = 10;
    for (let i = 0; i < templates.length; i += CHUNK_SIZE) {
      const chunk = templates.slice(i, i + CHUNK_SIZE);

      const chunkTemplateIds = chunk.map((t: { id: string }) => t.id);

      const allJobs = await this.prisma.reconJob.findMany({
        where: { templateId: { in: chunkTemplateIds } },
        select: { id: true, templateId: true },
        take: CHUNK_SIZE * 1000,
      });

      const jobsByTemplateId = new Map<string, { id: string }[]>();
      for (const job of allJobs) {
        if (!job.templateId) continue;
        if (!jobsByTemplateId.has(job.templateId)) {
          jobsByTemplateId.set(job.templateId, []);
        }
        const jobsList = jobsByTemplateId.get(job.templateId)!;
        if (jobsList.length < 1000) {
          jobsList.push({ id: job.id });
        }
      }

      const allRelevantJobIds = Array.from(jobsByTemplateId.values()).flat().map((j) => j.id);

      const [allDrifts, allResults] = await Promise.all([
        allRelevantJobIds.length > 0 ? this.prisma.driftEvent.findMany({
          where: { reconJobId: { in: allRelevantJobIds } },
          select: { id: true, reconJobId: true },
          take: CHUNK_SIZE * 100,
        }) : Promise.resolve([]),
        allRelevantJobIds.length > 0 ? this.prisma.reconResult.findMany({
          where: { reconJobId: { in: allRelevantJobIds } },
          select: { id: true, reconJobId: true, status: true },
          take: CHUNK_SIZE * 1000,
        }) : Promise.resolve([]),
      ]);

      const driftsByJobId = new Map<string, { id: string }[]>();
      for (const drift of allDrifts) {
        if (!drift.reconJobId) continue;
        if (!driftsByJobId.has(drift.reconJobId)) {
          driftsByJobId.set(drift.reconJobId, []);
        }
        driftsByJobId.get(drift.reconJobId)!.push({ id: drift.id });
      }

      const resultsByJobId = new Map<string, { id: string, status: string }[]>();
      for (const result of allResults) {
        if (!result.reconJobId) continue;
        if (!resultsByJobId.has(result.reconJobId)) {
          resultsByJobId.set(result.reconJobId, []);
        }
        resultsByJobId.get(result.reconJobId)!.push({ id: result.id, status: result.status });
      }

      for (const template of chunk) {
        const jobs = jobsByTemplateId.get(template.id) || [];
        const popularity = Math.min(jobs.length / 1000, 1.0);

        let drifts: { id: string }[] = [];
        for (const job of jobs) {
          if (drifts.length >= 100) break;
          const jobDrifts = driftsByJobId.get(job.id) || [];
          drifts = drifts.concat(jobDrifts);
        }
        drifts = drifts.slice(0, 100);

        const driftRate = drifts.length / Math.max(jobs.length, 1);

        let results: { id: string, status: string }[] = [];
        for (const job of jobs) {
          if (results.length >= 1000) break;
          const jobResults = resultsByJobId.get(job.id) || [];
          results = results.concat(jobResults);
        }
        results = results.slice(0, 1000);

        const failures = results.filter((r: { status: string }) => r.status === "failed").length;
        const reliability = 1 - failures / Math.max(results.length, 1);

        const revenuePotential = popularity * reliability * 1000; // Placeholder

        items.push({
          id: template.id,
          type: "template",
          name: template.name,
          popularity,
          driftRate,
          reliability,
          revenuePotential,
        });
      }
    }`;

code = code.replace(search, replace);
fs.writeFileSync(filePath, code);

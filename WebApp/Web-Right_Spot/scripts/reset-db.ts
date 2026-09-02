import { WorkflowApplication } from "../src/server/application/workflow";

const application = new WorkflowApplication();
try {
  const reset = application.reset(new Date().toISOString());
  console.log(`workflow fixture generation ${reset.generation}`);
} finally {
  application.close();
}

require("dotenv").config();
const UserModel = require("../models/User.schema");
const aIChatCompletion = require("../ai_provider");
const { extractJsonArray } = require("../utilities/functions");
const {
  generateJsonFormatterPrompt,
  generateCodeGenerationPrompt,
  generateCodeOverviewPrompt,
} = require("../utilities/promptUtils");

class ProjectCoordinator {
  constructor(userId, projectId) {
    this.projectId = projectId;
    this.userId = userId;
  }

  async logStep(message) {
    await UserModel.addSystemLogToProject(this.userId, this.projectId, message);
  }

  async findFirstArray(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const firstArray = Object.values(data).find((value) =>
        Array.isArray(value),
      );
      if (firstArray) {
        return firstArray;
      }
    }

    return [data];
  }

  async JSONFormatter(rawJsonString, error) {
    const prompt = generateJsonFormatterPrompt(rawJsonString, error);
    ({
      userId: this.userId,
      systemPrompt: prompt,
      responseFormat: { type: "json_object" },
    });
    const res = await aIChatCompletion({
      userId: this.userId,
      systemPrompt: prompt,
      responseFormat: { type: "json_object" },
    });

    try {
      let formattedJson = JSON.parse(res);
      return formattedJson;
    } catch (error) {
      console.error("Error parsing JSON Again:", error);
    }
  }

  async extractAndParseJson(rawJsonString) {
    try {
      const jsonArrayString = await extractJsonArray(rawJsonString);
      const parsedArray = JSON.parse(jsonArrayString);
      return parsedArray;
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      return null;
    }
  }

  async storeTasks(userId, tasks) {
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    for (const task of tasks) {
      try {
        await UserModel.addTaskToProject(userId, this.projectId, task);
      } catch (error) {
        console.error("Error adding or updating task:", error);
      }
    }
  }

  async codeWriter(message) {
    try {
      const selectedProject = await UserModel.getUserProject(
        this.userId,
        this.projectId,
      );
      let { taskList, projectOverView } = selectedProject;
      const prompt = generateCodeGenerationPrompt(projectOverView, taskList);

      const response = await aIChatCompletion({
        userId: this.userId,
        systemPrompt: `User's requirements: ${message}\n${prompt}`,
      });
      return response;
    } catch (error) {
      await this.logStep("Error in code generation:", error);
      return "";
    }
  }

  async codeAnalyzer(codeToAnalyze) {
    try {
      const mainPrompt = generateCodeOverviewPrompt(codeToAnalyze);
      const prompt = `${mainPrompt} \n\nCode to analyze:\n${JSON.stringify(codeToAnalyze, null, 2)}`;
      const aiResponse = await aIChatCompletion({
        userId: this.userId,
        systemPrompt: prompt,
      });

      return aiResponse;
    } catch (error) {
      await this.logStep("Error in code analysis:", error);
      return "";
    }
  }
}

module.exports = ProjectCoordinator;

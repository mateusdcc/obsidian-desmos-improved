import { Graph } from "./graph";
import { Plugin } from "obsidian";
import { Renderer } from "./renderer";
import { renderError } from "./error";
import { DEFAULT_SETTINGS, migrateSettings, Settings, SettingsTab } from "./settings";


export default class Desmos extends Plugin {
    // We load the settings before accessing them, so we can ensure this object always exists
    settings!: Settings;

    // We create the renderer before registering the codeblock, so we can ensure this object always exists
    renderer!: Renderer;

    /** Helper for in-memory graph caching */
    graphCache: Record<string, string> = {};

    async onload() {
        await this.loadSettings();
        this.renderer = new Renderer(this);
        this.renderer.activate();

        this.addSettingTab(new SettingsTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor("desmos-graph", async (source, el) => {
            try {
                const graph = Graph.parse(source, this.settings.graph_settings);
                await this.renderer.render(graph, el);
            } catch (err) {
                if (err instanceof Error) {
                    renderError(err.message, el);
                } else if (typeof err === "string") {
                    renderError(err, el);
                } else {
                    renderError("Unexpected error - see console for debug log", el);
                    console.error(err);
                }
            }
        });
    }

    async unload() {
        this.renderer.deactivate();
    }

    async loadSettings() {
        let settings = await this.loadData();

        if (!settings) {
            settings = DEFAULT_SETTINGS(this);
        }

        if (settings.version !== this.manifest.version) {
            settings = migrateSettings(this, settings);
        }

        this.settings = settings;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

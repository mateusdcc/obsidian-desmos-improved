import Desmos from "./main";
import { PluginSettingTab, App, Setting } from "obsidian";
import { GraphSettings, DegreeMode } from "./graph/interface"

export enum CacheLocation {
    Memory = "Memory",
    Filesystem = "Filesystem",
}

export interface Settings {
    /** The program version these settings were created in */
    version: string;
    /** Whether to use an older version of the Desmos API (v1.5), this is required for offline mode to work */
    use_legacy_desmos_api: boolean;
    // /** The debounce timer (in ms) */
    // debounce: number;
    cache: CacheSettings;
    /** The default graph settings */
    graph_settings: GraphSettings;
}

export interface CacheSettings {
    enabled: boolean;
    location: CacheLocation;
    directory?: string;
}

const DEFAULT_SETTINGS_STATIC: Omit<Settings, "version"> = {
    // debounce: 500,
    use_legacy_desmos_api: false,
    cache: {
        enabled: true,
        location: CacheLocation.Memory,
    },
    graph_settings: {
        width: 600,
        height: 400,
        left: -7,
        right: 7,
        bottom: -7,
        top: 7,
        grid: true,
        degreeMode: DegreeMode.Radians,
        showYAxis: true,
        showXAxis: true,
        invertedColors: false,
        hideAxisNumbers: false,
    }
};


/** Get the default settings for the given plugin. This simply uses `DEFAULT_SETTINGS_STATIC` and patches the version from the manifest. */
export function DEFAULT_SETTINGS(plugin: Desmos): Settings {
    return {
        version: plugin.manifest.version,
        ...DEFAULT_SETTINGS_STATIC,
    };
}

function constructGraphSettingElement(this: any, containerEl: any, description: string, setting: keyof GraphSettings) {
    return new Setting(containerEl)
        .setName(description)
        .setDesc(`The ${description} of the rendered graph`)
        .addText((text) =>
            text.setValue(this.plugin.settings.graph_settings[setting].toString()).onChange(async (value) => {
                const val = Number(value);
                if (Number.isNaN(val)) {
                    this.plugin.settings.graph_settings[setting] = DEFAULT_SETTINGS_STATIC.graph_settings[setting];
                } else {
                    this.plugin.settings.graph_settings[setting] = val;
                }
                await this.plugin.saveSettings();
            })
        );
}
/** Attempt to migrate the given settings object to the current structure */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSettings(plugin: Desmos, settings: any): Settings {
    if (!Object.prototype.hasOwnProperty.call(settings, "use_legacy_desmos_api")) {
        settings.use_legacy_desmos_api = DEFAULT_SETTINGS_STATIC.use_legacy_desmos_api;
    }

    return settings as Settings;
}

export class SettingsTab extends PluginSettingTab {
    plugin: Desmos;

    constructor(app: App, plugin: Desmos) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        // new Setting(containerEl)
        //     .setName("Debounce Time (ms)")
        //     .setDesc(
        //         "How long to wait after a keypress to render the graph (set to 0 to disable, requires restart to take effect)"
        //     )
        //     .addText((text) =>
        //         text.setValue(this.plugin.settings.debounce.toString()).onChange(async (value) => {
        //             const val = parseInt(value);
        //             this.plugin.settings.debounce =
        //                 Number.isNaN(val) || val < 0 ? DEFAULT_SETTINGS_STATIC.debounce : val;
        //             await this.plugin.saveSettings();
        //         })
        //     );

        containerEl.createEl("h1", { text: "Plugin Settings" });
        containerEl.createEl("h2", { text: "Graph Settings" });
        containerEl.createEl("p", { text: "**You must reload obsidian for the changes to apply**" });
        constructGraphSettingElement.call(this, containerEl, "Width", "width");
        constructGraphSettingElement.call(this, containerEl, "Height", "height");
        constructGraphSettingElement.call(this, containerEl, "Left Bound", "left");
        constructGraphSettingElement.call(this, containerEl, "Right Bound", "right");
        constructGraphSettingElement.call(this, containerEl, "Bottom Bound", "bottom");
        constructGraphSettingElement.call(this, containerEl, "Top Bound", "top");
        new Setting(containerEl)
            .setName("Grid")
            .setDesc("Whether to show the grid or not")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.graph_settings.grid).onChange(async (value) => {
                    this.plugin.settings.graph_settings.grid = value;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Degree Mode")
            .setDesc("The degree mode to use for trigonometry functions")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(DegreeMode.Radians, "Radians")
                    .addOption(DegreeMode.Degrees, "Degrees")
                    .setValue(this.plugin.settings.graph_settings.degreeMode)
                    .onChange(async (value) => {
                        this.plugin.settings.graph_settings.degreeMode = value as DegreeMode;
                        await this.plugin.saveSettings();
                    })
            );
        new Setting(containerEl)
            .setName("Hide Axis Numbers")
            .setDesc("Whether to hide all axis numbers")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.graph_settings.hideAxisNumbers).onChange(async (value) => {
                    this.plugin.settings.graph_settings.hideAxisNumbers = value;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Show X Axis")
            .setDesc("Whether to show the x-axis")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.graph_settings.showXAxis).onChange(async (value) => {
                    this.plugin.settings.graph_settings.showXAxis = value;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Show Y Axis")
            .setDesc("Whether to show the y-axis")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.graph_settings.showYAxis).onChange(async (value) => {
                    this.plugin.settings.graph_settings.showYAxis = value;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Inverted Colors")
            .setDesc("Whether to invert the colors of the graph")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.graph_settings.invertedColors).onChange(async (value) => {
                    this.plugin.settings.graph_settings.invertedColors = value;
                    await this.plugin.saveSettings();
                })
            );
        containerEl.createEl("h2", { text: "Cache" });

        new Setting(containerEl)
            .setName("Cache")
            .setDesc("Whether to cache the rendered graphs")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.cache.enabled).onChange(async (value) => {
                    this.plugin.settings.cache.enabled = value;
                    await this.plugin.saveSettings();

                    // Reset the display so the new state can render
                    this.display();
                })
            );

        if (this.plugin.settings.cache.enabled) {
            new Setting(containerEl)
                .setName("Cache location")
                .setDesc("Set the location to cache rendered graphs (note that memory caching is not persistent)")
                .addDropdown((dropdown) =>
                    dropdown
                        .addOption(CacheLocation.Memory, "Memory")
                        .addOption(CacheLocation.Filesystem, "Filesystem")
                        .setValue(this.plugin.settings.cache.location)
                        .onChange(async (value) => {
                            this.plugin.settings.cache.location = value as CacheLocation;
                            await this.plugin.saveSettings();

                            // Reset the display so the new state can render
                            this.display();
                        })
                );

            if (this.plugin.settings.cache.location === CacheLocation.Filesystem) {
                new Setting(containerEl)
                    .setName("Cache Directory")
                    .setDesc(
                        `The directory to save cached graphs in, relative to the vault root (technical note: the graphs will be saved as \`desmos-graph-<hash>.svg\` where the name is a SHA-256 hash of the graph source). Also note that a lot of junk will be saved to this folder, you have been warned.`
                    )
                    .addText((text) => {
                        text.setValue(this.plugin.settings.cache.directory ?? "").onChange(async (value) => {
                            this.plugin.settings.cache.directory = value;
                            await this.plugin.saveSettings();
                        });
                    });
            }
        }

        containerEl.createEl("h2", { text: "Misc" });
        new Setting(containerEl)
            .setName("Use Legacy Desmos API")
            .setDesc(
                "Whether to use a legacy version (v1.5) of the Desmos API over the current latest version, this must be enabled for offline usage to work as versions >1.5 require an internet connection. Enabling this will prevent any features from later versions from functioning correctly."
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.use_legacy_desmos_api).onChange(async (value) => {
                    this.plugin.settings.use_legacy_desmos_api = value;
                    await this.plugin.saveSettings();

                    // Reset the display so the new state can render
                    this.display();
                })
            );
    }
}

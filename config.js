import { @Vigilant, @SwitchProperty } from "Vigilance";

const moduleVersion = JSON.parse(FileLib.read("PositionalTitles", "metadata.json")).version;
const moduleAuthor = JSON.parse(FileLib.read("PositionalTitles", "metadata.json")).author;
const configHeader = `&8[&6PositionalTitles&8] &ev${moduleVersion} \nMade by ${moduleAuthor}&r`

@Vigilant("PositionalTitles", "PositionalTitles", {
})

class Config {
    @SwitchProperty({
        name: "Enable Positional Titles",
        description: "Enable Positional Titles.",
        category: "Dungeons",
        subcategory: "Dungeons"
    })
    toggled = true;

    constructor() {
        this.initialize(this);

        this.setCategoryDescription("Dungeons", `${configHeader}`);
    }
}

export default new Config();
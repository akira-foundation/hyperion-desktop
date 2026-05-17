export namespace ai {
	
	export class Capabilities {
	    streaming: boolean;
	    vision: boolean;
	    tools: boolean;
	    thinking: boolean;
	    promptCache: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Capabilities(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.streaming = source["streaming"];
	        this.vision = source["vision"];
	        this.tools = source["tools"];
	        this.thinking = source["thinking"];
	        this.promptCache = source["promptCache"];
	    }
	}
	export class GenerateOutput {
	    content: string;
	    inputTokens: number;
	    outputTokens: number;
	    cacheRead: number;
	    cacheWrite: number;
	    model: string;
	
	    static createFrom(source: any = {}) {
	        return new GenerateOutput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.content = source["content"];
	        this.inputTokens = source["inputTokens"];
	        this.outputTokens = source["outputTokens"];
	        this.cacheRead = source["cacheRead"];
	        this.cacheWrite = source["cacheWrite"];
	        this.model = source["model"];
	    }
	}
	export class Message {
	    role: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.role = source["role"];
	        this.content = source["content"];
	    }
	}
	export class ModelInfo {
	    id: string;
	    name: string;
	    contextSize: number;
	    default: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ModelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.contextSize = source["contextSize"];
	        this.default = source["default"];
	    }
	}
	export class ProviderInfo {
	    name: string;
	    displayName: string;
	    available: boolean;
	    reason?: string;
	    capabilities: Capabilities;
	    models: ModelInfo[];
	
	    static createFrom(source: any = {}) {
	        return new ProviderInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.displayName = source["displayName"];
	        this.available = source["available"];
	        this.reason = source["reason"];
	        this.capabilities = this.convertValues(source["capabilities"], Capabilities);
	        this.models = this.convertValues(source["models"], ModelInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace application {
	
	export class Attachment {
	    filename: string;
	    base64: string;
	
	    static createFrom(source: any = {}) {
	        return new Attachment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.base64 = source["base64"];
	    }
	}
	export class GenerateImageRequest {
	    provider: string;
	    model: string;
	    prompt: string;
	    size: string;
	    quality: string;
	    kind: string;
	
	    static createFrom(source: any = {}) {
	        return new GenerateImageRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.model = source["model"];
	        this.prompt = source["prompt"];
	        this.size = source["size"];
	        this.quality = source["quality"];
	        this.kind = source["kind"];
	    }
	}
	export class GenerateRequest {
	    provider: string;
	    model: string;
	    system: string;
	    messages: ai.Message[];
	    maxTokens: number;
	
	    static createFrom(source: any = {}) {
	        return new GenerateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.model = source["model"];
	        this.system = source["system"];
	        this.messages = this.convertValues(source["messages"], ai.Message);
	        this.maxTokens = source["maxTokens"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GenerateTemplateInput {
	    name: string;
	    description: string;
	    prompt: string;
	    width: number;
	    height: number;
	    slideCount: number;
	    category: string;
	    attachments: Attachment[];
	    localRefs: string[];
	    urls: string[];
	
	    static createFrom(source: any = {}) {
	        return new GenerateTemplateInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.prompt = source["prompt"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.slideCount = source["slideCount"];
	        this.category = source["category"];
	        this.attachments = this.convertValues(source["attachments"], Attachment);
	        this.localRefs = source["localRefs"];
	        this.urls = source["urls"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SaveTemplateInput {
	    sourceDir: string;
	    name: string;
	    description: string;
	    category: string;
	    source: string;
	    size: template.Size;
	
	    static createFrom(source: any = {}) {
	        return new SaveTemplateInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sourceDir = source["sourceDir"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.source = source["source"];
	        this.size = this.convertValues(source["size"], template.Size);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace draft {
	
	export class Draft {
	    id: string;
	    title: string;
	    body: string;
	    platform: string;
	    status: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Draft(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.body = source["body"];
	        this.platform = source["platform"];
	        this.status = source["status"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace image {
	
	export class Capabilities {
	    quality: boolean;
	    variants: boolean;
	    inpaint: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Capabilities(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.quality = source["quality"];
	        this.variants = source["variants"];
	        this.inpaint = source["inpaint"];
	    }
	}
	export class GeneratedImage {
	    id: string;
	    filename: string;
	    path: string;
	    url: string;
	    prompt: string;
	    model: string;
	    provider: string;
	    size: string;
	    quality: string;
	    kind: string;
	    mimeType: string;
	    sizeBytes: number;
	    width: number;
	    height: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new GeneratedImage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.filename = source["filename"];
	        this.path = source["path"];
	        this.url = source["url"];
	        this.prompt = source["prompt"];
	        this.model = source["model"];
	        this.provider = source["provider"];
	        this.size = source["size"];
	        this.quality = source["quality"];
	        this.kind = source["kind"];
	        this.mimeType = source["mimeType"];
	        this.sizeBytes = source["sizeBytes"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ModelInfo {
	    id: string;
	    name: string;
	    sizes: string[];
	    qualities: string[];
	    default: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ModelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sizes = source["sizes"];
	        this.qualities = source["qualities"];
	        this.default = source["default"];
	    }
	}
	export class ProviderInfo {
	    name: string;
	    displayName: string;
	    available: boolean;
	    reason?: string;
	    capabilities: Capabilities;
	    models: ModelInfo[];
	
	    static createFrom(source: any = {}) {
	        return new ProviderInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.displayName = source["displayName"];
	        this.available = source["available"];
	        this.reason = source["reason"];
	        this.capabilities = this.convertValues(source["capabilities"], Capabilities);
	        this.models = this.convertValues(source["models"], ModelInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class ImportFile {
	    path: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new ImportFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	    }
	}

}

export namespace settings {
	
	export class Settings {
	    theme: string;
	    onboardingDone: boolean;
	    defaultAiProvider: string;
	    defaultImageProvider: string;
	    defaultModel: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.onboardingDone = source["onboardingDone"];
	        this.defaultAiProvider = source["defaultAiProvider"];
	        this.defaultImageProvider = source["defaultImageProvider"];
	        this.defaultModel = source["defaultModel"];
	    }
	}

}

export namespace skill {
	
	export class GeneratedFile {
	    path: string;
	    kind: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new GeneratedFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.kind = source["kind"];
	        this.size = source["size"];
	    }
	}
	export class RunRequest {
	    skillId: string;
	    projectPath: string;
	    provider: string;
	
	    static createFrom(source: any = {}) {
	        return new RunRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillId = source["skillId"];
	        this.projectPath = source["projectPath"];
	        this.provider = source["provider"];
	    }
	}
	export class RunResult {
	    outputDir: string;
	    files: GeneratedFile[];
	    caption: string;
	    log: string;
	
	    static createFrom(source: any = {}) {
	        return new RunResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.outputDir = source["outputDir"];
	        this.files = this.convertValues(source["files"], GeneratedFile);
	        this.caption = source["caption"];
	        this.log = source["log"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Skill {
	    id: string;
	    name: string;
	    description: string;
	    category: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new Skill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	    }
	}

}

export namespace template {
	
	export class Size {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new Size(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class CarouselRenderRequest {
	    templateId: string;
	    payload: Record<string, any>;
	    size: Size;
	    slideCount: number;
	
	    static createFrom(source: any = {}) {
	        return new CarouselRenderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.templateId = source["templateId"];
	        this.payload = source["payload"];
	        this.size = this.convertValues(source["size"], Size);
	        this.slideCount = source["slideCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RenderResult {
	    path: string;
	    width: number;
	    height: number;
	    sizeBytes: number;
	
	    static createFrom(source: any = {}) {
	        return new RenderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.sizeBytes = source["sizeBytes"];
	    }
	}
	export class CarouselRenderResult {
	    directory: string;
	    files: RenderResult[];
	
	    static createFrom(source: any = {}) {
	        return new CarouselRenderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.directory = source["directory"];
	        this.files = this.convertValues(source["files"], RenderResult);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RenderRequest {
	    templateId: string;
	    props: Record<string, any>;
	    size: Size;
	    slideIndex: number;
	
	    static createFrom(source: any = {}) {
	        return new RenderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.templateId = source["templateId"];
	        this.props = source["props"];
	        this.size = this.convertValues(source["size"], Size);
	        this.slideIndex = source["slideIndex"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RuntimeSlide {
	    index: number;
	    filename: string;
	
	    static createFrom(source: any = {}) {
	        return new RuntimeSlide(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.filename = source["filename"];
	    }
	}
	export class RuntimeTemplate {
	    id: string;
	    slug: string;
	    name: string;
	    description: string;
	    category: string;
	    kind: string;
	    size: Size;
	    source: string;
	    slides: RuntimeSlide[];
	    assets: string[];
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new RuntimeTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.slug = source["slug"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.kind = source["kind"];
	        this.size = this.convertValues(source["size"], Size);
	        this.source = source["source"];
	        this.slides = this.convertValues(source["slides"], RuntimeSlide);
	        this.assets = source["assets"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}


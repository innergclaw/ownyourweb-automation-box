import SwiftUI

struct Offer: Identifiable, Equatable {
    enum Kind: String, CaseIterable, Identifiable {
        case service = "Service"
        case package = "Package"

        var id: String { rawValue }
    }

    let id = UUID()
    var kind: Kind
    var name: String
    var price: String
    var details: String
}

enum GeneratorStep: String, CaseIterable, Identifiable {
    case business = "Business"
    case services = "Services"
    case workflow = "Workflow"
    case outputs = "Outputs"

    var id: String { rawValue }
}

struct ContentView: View {
    @State private var selectedStep: GeneratorStep = .business
    @State private var businessName = "Studio Nova Creative"
    @State private var ownerName = "Nas"
    @State private var niche = "brand identity and launch graphics for local founders"
    @State private var contactMethod = "Instagram DM or inquiry form"
    @State private var positioning = "We help service-based creators turn scattered ideas into clean visual systems, launch-ready assets, and repeatable client workflows."
    @State private var timeline = "5 to 14 business days"
    @State private var deliverables = "Logo suite, color palette, typography guide, social media templates, launch graphics, client-ready file handoff, and project folder organization."
    @State private var firstStep = "Inquiry review and fit check"
    @State private var paymentPolicy = "50% deposit to book, balance due before final files"
    @State private var revisionPolicy = "Two revision rounds included"
    @State private var folderRoot = "$HOME/Creative Clients"
    @State private var workflowStages = "Inquiry, Proposal, Deposit, Discovery, Design, Revision, Approval, Handoff, Follow-up"
    @State private var offers = [
        Offer(kind: .package, name: "Brand Starter Kit", price: "$350", details: "Logo direction, color palette, typography, and starter social assets."),
        Offer(kind: .package, name: "Launch Identity System", price: "$850", details: "Full brand identity system with launch-ready graphics and organized handoff."),
        Offer(kind: .service, name: "Client Folder Automation Setup", price: "$150", details: "A clean local folder structure and project checklist for repeat client work.")
    ]

    private var stages: [String] {
        workflowStages
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    HeaderCard()
                    stepPicker
                    currentStepCard
                    OutputSection(
                        websiteCopy: websiteCopy,
                        dashboardCopy: dashboardCopy,
                        folderScript: folderScript
                    )
                    LinkBar(style: .footer)
                }
                .padding(12)
            }
            .background(
                LinearGradient(
                    colors: [.white, Color(red: 0.68, green: 0.71, blue: 0.73)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .navigationTitle("OWNYOURWEB")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    LinkBar(style: .compact)
                }
            }
        }
        .tint(.primary)
    }

    private var stepPicker: some View {
        Picker("Generator step", selection: $selectedStep) {
            ForEach(GeneratorStep.allCases) { step in
                Text(step.rawValue).tag(step)
            }
        }
        .pickerStyle(.segmented)
        .padding(12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private var currentStepCard: some View {
        switch selectedStep {
        case .business:
            FormCard(eyebrow: "Business core", title: "Set the brand foundation") {
                Field("Business name", text: $businessName)
                Field("Owner name", text: $ownerName)
                Field("Primary niche", text: $niche)
                Field("Contact method", text: $contactMethod)
                Field("Positioning statement", text: $positioning, axis: .vertical)
            }
        case .services:
            FormCard(eyebrow: "Offers", title: "Build the offer list") {
                OfferBuilder(offers: $offers)
                Field("Average timeline", text: $timeline)
                Field("Deliverables", text: $deliverables, axis: .vertical)
            }
        case .workflow:
            FormCard(eyebrow: "Operations", title: "Map the client journey") {
                Field("First step", text: $firstStep)
                Field("Payment policy", text: $paymentPolicy)
                Field("Revision policy", text: $revisionPolicy)
                Field("Folder location", text: $folderRoot)
                Field("Workflow stages", text: $workflowStages, axis: .vertical)
            }
        case .outputs:
            FormCard(eyebrow: "Generation", title: "Automation box ready") {
                Button {
                    selectedStep = .outputs
                } label: {
                    Label("Generated from current inputs", systemImage: "checkmark.seal.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private var websiteCopy: String {
        """
        \(businessName)
        Curated by SHOPNASGFX under the OWNYOURWEB ecosystem

        For \(niche)

        \(positioning)

        Services and Packages
        \(offers.enumerated().map { index, offer in
            "\(index + 1). [\(offer.kind.rawValue)] \(offer.name)\(offer.price.isEmpty ? "" : " - \(offer.price)")\n   \(offer.details)"
        }.joined(separator: "\n"))

        What clients receive
        \(deliverables)

        Project timeline
        Most projects are completed within \(timeline), depending on scope, feedback speed, and final approval.

        How to start
        Step 1: \(firstStep)
        Step 2: Submit your details through \(contactMethod)
        Step 3: Review the proposal, approve the scope, and book your project
        Step 4: Complete onboarding so the creative work can begin with clarity

        Policies
        Payment: \(paymentPolicy)
        Revisions: \(revisionPolicy)

        Client flow
        \(stages.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n"))
        """
    }

    private var dashboardCopy: String {
        """
        Client Dashboard Template
        Business: \(businessName)
        Owner: \(ownerName)
        Primary niche: \(niche)

        Client Record
        - Client name:
        - Business name:
        - Email:
        - Phone or social handle:
        - Selected service/package:
        - Project investment:
        - Start date:
        - Target delivery date:
        - Deposit status:
        - Final payment status:

        Project Stages
        \(stages.map { "- [ ] \($0)" }.joined(separator: "\n"))

        Offer Menu
        \(offers.map { "- [ ] \($0.kind.rawValue): \($0.name)\($0.price.isEmpty ? "" : " (\($0.price))")" }.joined(separator: "\n"))

        Onboarding Checklist
        - [ ] Confirm project fit
        - [ ] Send proposal
        - [ ] Collect deposit
        - [ ] Create project folder
        - [ ] Collect brand questionnaire
        - [ ] Collect inspiration and assets
        - [ ] Confirm timeline
        - [ ] Schedule review points
        """
    }

    private var folderScript: String {
        let safeBusiness = businessName
            .filter { $0.isLetter || $0.isNumber || $0 == " " || $0 == "_" || $0 == "-" }
            .split(separator: " ")
            .joined(separator: "_")
        let folders = [
            "01_Admin",
            "02_Client_Intake",
            "03_Strategy",
            "04_Design_Working_Files",
            "05_Review_Exports",
            "06_Final_Deliverables",
            "07_Invoices_Receipts",
            "08_Testimonial_Follow_Up"
        ]

        return """
        # macOS / Linux folder setup
        CLIENT_NAME="New Client"
        PROJECT_NAME="\(safeBusiness)_Project"
        ROOT="\(folderRoot)"
        PROJECT_PATH="$ROOT/$CLIENT_NAME/$PROJECT_NAME"

        mkdir -p "$PROJECT_PATH"
        \(folders.map { "mkdir -p \"$PROJECT_PATH/\($0)\"" }.joined(separator: "\n"))

        echo "Client project system created at: $PROJECT_PATH"
        """
    }
}

struct HeaderCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            LinkBar(style: .header)

            HStack(spacing: 12) {
                Text("OY")
                    .font(.system(.caption, design: .monospaced).weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Color(red: 0.07, green: 0.09, blue: 0.15), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                Text("Quantum Core Diagnostics / SHOPNASGFX")
                    .font(.system(.caption, design: .monospaced))
                    .textCase(.uppercase)
            }

            Text("OWNYOURWEB\nAutomation Box")
                .font(.system(size: 48, weight: .thin, design: .monospaced))
                .lineLimit(nil)
                .minimumScaleFactor(0.7)

            Text("Build a client-ready digital operating system for creative service businesses. Fill in the essentials, then generate a service website, onboarding dashboard, and local project folder scripts in one clean pass.")
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)

            DiagnosticPreview()
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Color(red: 0.96, green: 0.97, blue: 0.98), Color(red: 0.89, green: 0.91, blue: 0.93)], startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 39, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 39, style: .continuous)
                .stroke(Color(red: 0.61, green: 0.64, blue: 0.69), lineWidth: 1)
        )
    }
}

struct DiagnosticPreview: View {
    var body: some View {
        VStack(spacing: 8) {
            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Circle().fill(.white).frame(width: 10, height: 10)
                    Circle().fill(.gray).frame(width: 10, height: 10)
                    Circle().fill(.secondary).frame(width: 10, height: 10)
                    Spacer()
                }

                Grid(horizontalSpacing: 8, verticalSpacing: 8) {
                    GridRow {
                        RoundedRectangle(cornerRadius: 12).fill(.linearGradient(colors: [.white, .gray.opacity(0.5)], startPoint: .top, endPoint: .bottom)).gridCellRows(2)
                        RoundedRectangle(cornerRadius: 12).fill(.linearGradient(colors: [.white, .gray.opacity(0.3)], startPoint: .top, endPoint: .bottom))
                    }
                    GridRow {
                        Color.clear
                        RoundedRectangle(cornerRadius: 12).fill(.gray)
                    }
                    GridRow {
                        RoundedRectangle(cornerRadius: 12).fill(.white).gridCellColumns(2)
                    }
                }
                .frame(height: 210)
            }
            .padding(16)
            .background(Color(red: 0.07, green: 0.09, blue: 0.15), in: RoundedRectangle(cornerRadius: 24, style: .continuous))

            HStack {
                ForEach(["01 Input", "02 Signal", "03 System", "04 Deploy"], id: \.self) { label in
                    Text(label)
                        .font(.system(.caption2, design: .monospaced))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(.white.opacity(0.7), in: Capsule())
                }
            }
        }
    }
}

struct FormCard<Content: View>: View {
    let eyebrow: String
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 8) {
                Text(eyebrow)
                    .font(.system(.caption, design: .monospaced))
                    .textCase(.uppercase)
                Text(title)
                    .font(.system(size: 30, weight: .thin, design: .monospaced))
            }

            content
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.12), radius: 24, y: 16)
    }
}

struct Field: View {
    let title: String
    @Binding var text: String
    var axis: Axis = .horizontal

    init(_ title: String, text: Binding<String>, axis: Axis = .horizontal) {
        self.title = title
        self._text = text
        self.axis = axis
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)
            if axis == .vertical {
                TextField(title, text: $text, axis: .vertical)
                    .font(.system(.body, design: .monospaced))
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)
            } else {
                TextField(title, text: $text)
                    .font(.system(.body, design: .monospaced))
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1)
            }
        }
    }
}

struct OfferBuilder: View {
    @Binding var offers: [Offer]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Services and packages")
                        .font(.system(.caption, design: .monospaced))
                        .textCase(.uppercase)
                    Text("Offer stack")
                        .font(.system(.caption, design: .monospaced).weight(.bold))
                        .textCase(.uppercase)
                }

                Spacer()

                Button {
                    offers.append(Offer(kind: .service, name: "", price: "", details: ""))
                } label: {
                    Image(systemName: "plus")
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.borderedProminent)
                .accessibilityLabel("Add service or package")
            }

            ForEach($offers) { $offer in
                VStack(spacing: 10) {
                    Picker("Type", selection: $offer.kind) {
                        ForEach(Offer.Kind.allCases) { kind in
                            Text(kind.rawValue).tag(kind)
                        }
                    }
                    .pickerStyle(.segmented)

                    Field("Name", text: $offer.name)
                    Field("Price", text: $offer.price)
                    Field("Details", text: $offer.details, axis: .vertical)

                    Button(role: .destructive) {
                        if offers.count > 1 {
                            offers.removeAll { $0.id == offer.id }
                        }
                    } label: {
                        Label("Remove offer", systemImage: "xmark")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding(14)
                .background(Color(red: 0.96, green: 0.97, blue: 0.98), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            }
        }
        .padding(16)
        .background(
            LinearGradient(colors: [Color(red: 0.96, green: 0.97, blue: 0.98), Color(red: 0.89, green: 0.91, blue: 0.93)], startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 24, style: .continuous)
        )
    }
}

struct OutputSection: View {
    let websiteCopy: String
    let dashboardCopy: String
    let folderScript: String

    var body: some View {
        FormCard(eyebrow: "Generated outputs", title: "System generated") {
            OutputCard(title: "Website copy", text: websiteCopy)
            OutputCard(title: "Client dashboard", text: dashboardCopy)
            OutputCard(title: "Folder automation", text: folderScript)
        }
    }
}

struct OutputCard: View {
    let title: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(.caption, design: .monospaced).weight(.bold))
                .textCase(.uppercase)
            Text(text)
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.white)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color(red: 0.07, green: 0.09, blue: 0.15), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
    }
}

struct LinkBar: View {
    enum Style {
        case header
        case compact
        case footer
    }

    let style: Style

    private let links = [
        ("YouTube", "play.rectangle.fill", "https://www.youtube.com/@SHOPNASGFX"),
        ("Now Hire", "person.crop.circle.badge.plus", "#now-hire"),
        ("GitHub", "chevron.left.forwardslash.chevron.right", "https://github.com/SHOPNASGFX")
    ]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(links, id: \.0) { title, icon, url in
                if let destination = URL(string: url) {
                    Link(destination: destination) {
                        Label(style == .compact ? "" : title, systemImage: icon)
                            .labelStyle(style == .compact ? .iconOnly : .titleAndIcon)
                            .font(.system(.caption, design: .monospaced).weight(.bold))
                            .textCase(.uppercase)
                            .padding(.horizontal, style == .compact ? 8 : 12)
                            .frame(height: 42)
                            .background(style == .footer ? .white : Color(red: 0.07, green: 0.09, blue: 0.15), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .foregroundStyle(style == .footer ? Color(red: 0.07, green: 0.09, blue: 0.15) : .white)
                    }
                    .accessibilityLabel(title)
                }
            }
        }
        .frame(maxWidth: style == .footer ? .infinity : nil, alignment: .trailing)
    }
}

#Preview {
    ContentView()
}

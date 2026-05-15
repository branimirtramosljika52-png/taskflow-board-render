package hr.sign;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.io.File;
import java.util.Properties;

public final class SignerSettingsDialog {
    private SignerSettingsDialog() {
    }

    public static void open() {
        Runnable task = () -> {
            try {
                showDialog();
            } catch (Exception error) {
                JOptionPane.showMessageDialog(
                        null,
                        "Settings se ne mogu otvoriti: " + safeMessage(error),
                        "SafeNexus PDF Signer",
                        JOptionPane.ERROR_MESSAGE
                );
            }
        };
        if (SwingUtilities.isEventDispatchThread()) {
            task.run();
        } else {
            try {
                SwingUtilities.invokeAndWait(task);
            } catch (Exception error) {
                throw new IllegalStateException("Settings prozor se ne moze otvoriti.", error);
            }
        }
    }

    private static void showDialog() {
        Properties properties = SignerConfig.loadRawProperties();

        JComboBox<String> mode = new JComboBox<>(new String[]{"mock", "real"});
        mode.setSelectedItem(properties.getProperty("signer.mode", "mock"));
        JCheckBox dryRun = new JCheckBox("Real mode dry-run (bez PIN-a i bez pravog potpisa)");
        dryRun.setSelected(Boolean.parseBoolean(properties.getProperty("real.dryRun", "true")));

        JTextArea allowlist = new JTextArea(properties.getProperty("api.allowlist", "https://safe-nexus.org"), 4, 44);
        JTextField providerOrder = new JTextField(properties.getProperty("providers.order", "EOI,FINA"), 32);
        JTextField eoiPath = new JTextField(properties.getProperty("eoi.pkcs11", "C:/Program Files/AKD/Certilia Middleware/pkcs11/AkdEidPkcs11_64.dll"), 32);
        JTextField eoiSlot = new JTextField(properties.getProperty("eoi.slotIndex", ""), 8);
        JTextField finaPath = new JTextField(properties.getProperty("fina.pkcs11", "C:/Windows/System32/eTPKCS11.dll"), 32);
        JTextField finaSlot = new JTextField(properties.getProperty("fina.slotIndex", ""), 8);
        JTextField fallbackKeyword = new JTextField(properties.getProperty("fallback.keyword", ""), 32);

        JPanel fields = new JPanel(new GridBagLayout());
        fields.setBorder(BorderFactory.createEmptyBorder(16, 16, 8, 16));
        int row = 0;
        row = addRow(fields, row, "Signer mode", mode, null);
        row = addRow(fields, row, "Dry-run", dryRun, null);
        row = addRow(fields, row, "API allowlist", new JScrollPane(allowlist), null);
        row = addRow(fields, row, "Provider order", providerOrder, null);
        row = addRow(fields, row, "eOI PKCS#11", eoiPath, browseButton(eoiPath));
        row = addRow(fields, row, "eOI slot", eoiSlot, null);
        row = addRow(fields, row, "FINA PKCS#11", finaPath, browseButton(finaPath));
        row = addRow(fields, row, "FINA slot", finaSlot, null);
        addRow(fields, row, "Fallback keyword", fallbackKeyword, null);

        JButton testBridge = new JButton("Test native bridge");
        JButton testToken = new JButton("Test token detection");
        JButton save = new JButton("Spremi");
        JButton close = new JButton("Zatvori");

        testBridge.addActionListener(event -> JOptionPane.showMessageDialog(
                null,
                "Native bridge je spreman.\n\nConfig: " + SignerConfig.resolveConfigPath()
                        + "\nMode: " + mode.getSelectedItem()
                        + "\nPIN se ne sprema u config.",
                "SafeNexus PDF Signer",
                JOptionPane.INFORMATION_MESSAGE
        ));

        testToken.addActionListener(event -> {
            try {
                Properties draft = toProperties(properties, mode, dryRun, allowlist, providerOrder, eoiPath, eoiSlot, finaPath, finaSlot, fallbackKeyword);
                SignerConfig.saveRawProperties(draft);
                SignerConfig config = SignerConfig.load();
                StringBuilder text = new StringBuilder("Token detection:\n\n");
                for (TokenService.TokenProbe probe : new TokenService().detectTokens(config)) {
                    text.append(probe.provider())
                            .append(": ")
                            .append(probe.present() ? "detektiran" : "nije detektiran")
                            .append(" - ")
                            .append(probe.message())
                            .append("\n");
                }
                JOptionPane.showMessageDialog(null, text.toString(), "SafeNexus PDF Signer", JOptionPane.INFORMATION_MESSAGE);
            } catch (Exception error) {
                JOptionPane.showMessageDialog(null, safeMessage(error), "SafeNexus PDF Signer", JOptionPane.ERROR_MESSAGE);
            }
        });

        JDialog dialog = new JDialog((java.awt.Frame) null, "SafeNexus PDF Signer Settings", true);
        save.addActionListener(event -> {
            try {
                SignerConfig.saveRawProperties(toProperties(properties, mode, dryRun, allowlist, providerOrder, eoiPath, eoiSlot, finaPath, finaSlot, fallbackKeyword));
                JOptionPane.showMessageDialog(dialog, "Settings su spremljeni.\nPIN nije spremljen.", "SafeNexus PDF Signer", JOptionPane.INFORMATION_MESSAGE);
            } catch (Exception error) {
                JOptionPane.showMessageDialog(dialog, safeMessage(error), "SafeNexus PDF Signer", JOptionPane.ERROR_MESSAGE);
            }
        });
        close.addActionListener(event -> dialog.dispose());

        JPanel buttons = new JPanel();
        buttons.add(testBridge);
        buttons.add(testToken);
        buttons.add(save);
        buttons.add(close);

        JPanel root = new JPanel(new BorderLayout());
        root.add(fields, BorderLayout.CENTER);
        root.add(buttons, BorderLayout.SOUTH);

        dialog.setContentPane(root);
        dialog.setMinimumSize(new Dimension(760, 520));
        dialog.setLocationRelativeTo(null);
        dialog.setVisible(true);
    }

    private static Properties toProperties(
            Properties original,
            JComboBox<String> mode,
            JCheckBox dryRun,
            JTextArea allowlist,
            JTextField providerOrder,
            JTextField eoiPath,
            JTextField eoiSlot,
            JTextField finaPath,
            JTextField finaSlot,
            JTextField fallbackKeyword
    ) {
        Properties out = new Properties();
        out.putAll(original);
        out.setProperty("signer.mode", String.valueOf(mode.getSelectedItem()));
        out.setProperty("real.dryRun", Boolean.toString(dryRun.isSelected()));
        out.setProperty("api.allowlist", allowlist.getText().trim());
        out.setProperty("providers.order", providerOrder.getText().trim());
        out.setProperty("eoi.pkcs11", eoiPath.getText().trim());
        out.setProperty("eoi.slotIndex", eoiSlot.getText().trim());
        out.setProperty("fina.pkcs11", finaPath.getText().trim());
        out.setProperty("fina.slotIndex", finaSlot.getText().trim());
        out.setProperty("fallback.keyword", fallbackKeyword.getText().trim());
        out.remove("eoi.pin");
        out.remove("fina.pin");
        out.remove("pin");
        return out;
    }

    private static int addRow(JPanel panel, int row, String label, java.awt.Component field, java.awt.Component trailing) {
        GridBagConstraints labelConstraints = new GridBagConstraints();
        labelConstraints.gridx = 0;
        labelConstraints.gridy = row;
        labelConstraints.anchor = GridBagConstraints.WEST;
        labelConstraints.insets = new Insets(6, 0, 6, 12);
        panel.add(new JLabel(label), labelConstraints);

        GridBagConstraints fieldConstraints = new GridBagConstraints();
        fieldConstraints.gridx = 1;
        fieldConstraints.gridy = row;
        fieldConstraints.weightx = 1;
        fieldConstraints.fill = GridBagConstraints.HORIZONTAL;
        fieldConstraints.insets = new Insets(6, 0, 6, 8);
        panel.add(field, fieldConstraints);

        if (trailing != null) {
            GridBagConstraints trailingConstraints = new GridBagConstraints();
            trailingConstraints.gridx = 2;
            trailingConstraints.gridy = row;
            trailingConstraints.insets = new Insets(6, 0, 6, 0);
            panel.add(trailing, trailingConstraints);
        }
        return row + 1;
    }

    private static JButton browseButton(JTextField target) {
        JButton button = new JButton("...");
        button.addActionListener(event -> {
            JFileChooser chooser = new JFileChooser();
            chooser.setFileSelectionMode(JFileChooser.FILES_ONLY);
            String current = target.getText().trim();
            if (!current.isBlank()) {
                chooser.setSelectedFile(new File(current));
            }
            if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) {
                target.setText(chooser.getSelectedFile().getAbsolutePath());
            }
        });
        return button;
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "Neocekivana greska." : message;
    }
}

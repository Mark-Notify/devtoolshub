import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import CommonLayout from "components/Layout";
import Jwtdecode from "../components/Jwt/Jwtdecode";
import QRCodeGen from "components/QRCode/QRCodeGen";
import JsonToXml from "components/JsonFormat/JsonToXml";
import JsonToXmlVertical from "components/JsonFormat/JsonToXmlVertical";
import JsonFormat from "components/JsonFormat/JsonFormat";
import JsonFormatVertical from "components/JsonFormat/JsonFormatVertical";
import TermsAndConditions from "components/terms-and-conditions";
import ProfilePage from "components/ProfilePage";
import Base64 from "../components/base64";
import MorseCode from "../components/MorseCode";
import ThaiEngKeyboard from "../components/ThaiEngKeyboard";
import CipherEncodeDecode from "../components/CipherEncodeDecode";
import Seo from "../components/Seo";
import { getSeo, TOOLS_SEO } from "../const/seo";

type Props = {
  type: string;
  seo: ReturnType<typeof getSeo>;
  isTool: boolean;
  index: boolean;
};

const Home: NextPage<Props> = ({ type, seo, isTool, index }) => {
  const renderComponent = () => {
    switch (type) {
      case "json-format":
        return <JsonFormat />;
      case "json-format-vertical":
        return <JsonFormatVertical />;
      case "xml-to-json":
        return <JsonToXml />;
      case "xml-to-json-vertical":
        return <JsonToXmlVertical />;
      case "jwt-decode":
        return <Jwtdecode />;
      case "qr-code-generator":
        return <QRCodeGen />;
      case "base64":
        return <Base64 />;
      case "morse-code-decoder":
        return <MorseCode />;
      case "thai-eng-keyboard":
        return <ThaiEngKeyboard />;
      case "cipher-encode-decode":
        return <CipherEncodeDecode />;
      case "terms-and-conditions":
        return <TermsAndConditions />;
      case "profile":
        return <ProfilePage />;
      default:
        return <JsonFormatVertical />;
    }
  };

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        url={seo.url}
        canonical={seo.canonical}
        keywords={seo.keywords}
        isTool={isTool}
        index={index}
      />
      <CommonLayout>
        <div className="min-h-full">{renderComponent()}</div>
      </CommonLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const type = (Array.isArray(query.type) ? query.type[0] : query.type) || "";
  const entry = type ? TOOLS_SEO[type] : undefined;
  const seo = getSeo(type);
  const index = entry ? entry.index !== false : true;
  const isTool = Boolean(entry) && index;
  return { props: { type, seo, isTool, index } };
};

export default Home;
